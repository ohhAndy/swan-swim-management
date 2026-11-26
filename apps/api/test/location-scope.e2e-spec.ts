import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import {
  seedAdmin,
  seedClassOffering,
  seedGuardian,
  seedLocation,
  seedTerm,
} from "./utils/seeds";

describe("Location scope (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const MANAGER = "test-manager";
  let newmarketId: string;
  let markhamId: string;
  let newmarketTermId: string;
  let markhamTermId: string;
  let newmarketEnrollmentId: string;
  let markhamEnrollmentId: string;
  let guardianId: string;

  const asManager = () => ({ "x-mock-auth-id": MANAGER, "x-mock-email": "manager@test.com" });

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    newmarketId = (await seedLocation(prisma, "newmarket", "Newmarket")).id;
    markhamId = (await seedLocation(prisma, "markham", "Markham")).id;

    await prisma.staffUser.create({
      data: {
        authId: MANAGER,
        email: "manager@test.com",
        fullName: "Test Manager",
        role: "manager",
        active: true,
        accessibleLocations: { connect: [{ id: newmarketId }] },
      },
    });

    const day = 86400000;
    newmarketTermId = (
      await seedTerm(prisma, "Newmarket Fall", new Date(), new Date(Date.now() + 60 * day), newmarketId)
    ).id;
    markhamTermId = (
      await seedTerm(prisma, "Markham Fall", new Date(), new Date(Date.now() + 60 * day), markhamId)
    ).id;

    guardianId = (await seedGuardian(prisma)).id;
    const student = await prisma.student.create({
      data: { firstName: "Sam", lastName: "Swimmer", guardianId },
    });
    const enroll = async (termId: string) => {
      const offering = await seedClassOffering(prisma, termId);
      return (
        await prisma.enrollment.create({
          data: { studentId: student.id, offeringId: offering.id, status: "active" },
        })
      ).id;
    };
    newmarketEnrollmentId = await enroll(newmarketTermId);
    markhamEnrollmentId = await enroll(markhamTermId);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("the x-location-id header", () => {
    it("accepts a location slug", async () => {
      const res = await request(app.getHttpServer())
        .get("/terms/all")
        .set(asManager())
        .set("x-location-id", "newmarket")
        .expect(200);
      expect(res.body.map((t: { id: string }) => t.id)).toEqual([newmarketTermId]);
    });

    it("refuses a location the manager is not assigned to", async () => {
      await request(app.getHttpServer())
        .get("/terms/all")
        .set(asManager())
        .set("x-location-id", markhamId)
        .expect(403);
    });

    it("lists only the manager's locations when no location is chosen", async () => {
      const res = await request(app.getHttpServer())
        .get("/terms/all")
        .set(asManager())
        .expect(200);
      expect(res.body.map((t: { id: string }) => t.id)).toEqual([newmarketTermId]);
    });

    it("lets an admin see every location with 'all'", async () => {
      const res = await request(app.getHttpServer())
        .get("/terms/all")
        .set("x-location-id", "all")
        .expect(200);
      expect(res.body.map((t: { id: string }) => t.id).sort()).toEqual(
        [newmarketTermId, markhamTermId].sort(),
      );
    });
  });

  describe("records at another location", () => {
    it("refuses a term route", async () => {
      await request(app.getHttpServer())
        .get(`/terms/${markhamTermId}`)
        .set(asManager())
        .expect(403);
      await request(app.getHttpServer())
        .get(`/terms/${newmarketTermId}`)
        .set(asManager())
        .expect(200);
    });

    it("refuses an enrollment change", async () => {
      await request(app.getHttpServer())
        .put(`/enrollments/${markhamEnrollmentId}/remarks`)
        .set(asManager())
        .send({ remarks: "Moved lanes" })
        .expect(403);
    });

    it("refuses moving an invoice to another location", async () => {
      const invoice = await prisma.invoice.create({
        data: {
          guardianId,
          totalAmount: 50,
          status: "partial",
          invoiceNumber: "INV-NM-1",
          locationId: newmarketId,
        },
      });
      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}`)
        .set(asManager())
        .send({ locationId: markhamId })
        .expect(403);
    });

    it("refuses reading another location's invoice", async () => {
      const invoice = await prisma.invoice.create({
        data: {
          guardianId,
          totalAmount: 50,
          status: "partial",
          invoiceNumber: "INV-MK-1",
          locationId: markhamId,
        },
      });
      await request(app.getHttpServer())
        .get(`/invoices/${invoice.id}`)
        .set(asManager())
        .expect(403);
    });
  });

  describe("POST /terms", () => {
    it("requires a location: there are no global terms", async () => {
      const res = await request(app.getHttpServer())
        .post("/terms")
        .send({
          name: "Winter",
          startDate: "2027-01-04",
          endDate: "2027-03-28",
          templates: [
            { title: "Mon Class", weekday: 1, startTime: "16:00", duration: 30, capacity: 4 },
          ],
        })
        .expect(400);
      expect(res.body.message).toBe("Select a location first.");
    });
  });
});
