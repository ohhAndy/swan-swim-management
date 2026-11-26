import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm, seedClassOffering, seedLocation } from "./utils/seeds";

describe("TrialBookingsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testSessionId: string;
  let testTrialId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    const term = await seedTerm(prisma);
    const offering = await seedClassOffering(prisma, term.id);

    const session = await prisma.classSession.create({
      data: {
        offeringId: offering.id,
        date: new Date(),
        status: "scheduled"
      }
    });
    testSessionId = session.id;

    const trial = await prisma.trialBooking.create({
      data: {
        classSessionId: testSessionId,
        childName: "Test Child",
        childAge: 5,
        parentPhone: "1234567890",
        status: "scheduled",
        classRatio: "3:1",
      },
    });
    testTrialId = trial.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /trial-bookings/upcoming", () => {
    it("should return upcoming trial bookings", async () => {
      const response = await request(app.getHttpServer())
        .get("/trial-bookings/upcoming")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /trial-bookings", () => {
    it("should create a trial booking", async () => {
      await request(app.getHttpServer())
        .post("/trial-bookings")
        .send({
          classSessionId: testSessionId,
          childName: "New Child",
          childAge: 6,
          parentPhone: "0987654321",
        })
        .expect(201);
      
      const trial = await prisma.trialBooking.findFirstOrThrow({
        where: {
          childName: "New Child"
        }
      });
      expect(trial).toMatchObject({
        classSessionId: testSessionId,
        childAge: 6,
        parentPhone: "0987654321",
        status: "scheduled",
      });
    });
  });

  describe("PATCH /trial-bookings/:id/status", () => {
    it("should update trial status", async () => {
      await request(app.getHttpServer())
        .patch(`/trial-bookings/${testTrialId}/status`)
        .send({ status: "attended" })
        .expect(200);
      
      const dbTrial = await prisma.trialBooking.findUnique({ where: { id: testTrialId } });
      expect(dbTrial?.status).toBe("attended");
    });
  });

  describe("DELETE /trial-bookings/:id", () => {
    it("should delete a trial booking", async () => {
      await request(app.getHttpServer())
        .delete(`/trial-bookings/${testTrialId}`)
        .expect(200);
      
      const dbTrial = await prisma.trialBooking.findUnique({ where: { id: testTrialId } });
      expect(dbTrial).toBeNull();
    });
  });

  describe("input validation", () => {
    it("rejects an unknown trial status", () => {
      return request(app.getHttpServer())
        .patch("/trial-bookings/any-id/status")
        .send({ status: "maybe" })
        .expect(400);
    });

    it("books trials for adult swimmers", async () => {
      const response = await request(app.getHttpServer())
        .post("/trial-bookings")
        .send({ classSessionId: testSessionId, childName: "Adult Swimmer", childAge: 35, parentPhone: "555" })
        .expect(201);
      expect(response.body.childAge).toBe(35);
    });

    it("rejects an age above 120", () => {
      return request(app.getHttpServer())
        .post("/trial-bookings")
        .send({ classSessionId: testSessionId, childName: "Too Old", childAge: 121, parentPhone: "555" })
        .expect(400);
    });

    it("rejects a booking without a child name", () => {
      return request(app.getHttpServer())
        .post("/trial-bookings")
        .send({ classSessionId: "s", childName: "", childAge: 5, parentPhone: "555" })
        .expect(400);
    });
  });

  describe("who can remove a trial", () => {
    const seedStaff = async (role: "supervisor" | "manager") =>
      prisma.staffUser.create({
        data: {
          authId: `test-${role}`,
          email: `${role}@test.com`,
          role,
          fullName: `Test ${role}`,
          active: true,
          accessibleLocations: { connect: [{ id: (await seedLocation(prisma)).id }] },
        },
      });

    it("does not treat an empty status as a delete", async () => {
      await seedStaff("supervisor");
      await request(app.getHttpServer())
        .patch(`/trial-bookings/${testTrialId}/status`)
        .set("x-mock-auth-id", "test-supervisor")
        .send({ status: "" })
        .expect(400);

      const dbTrial = await prisma.trialBooking.findUnique({ where: { id: testTrialId } });
      expect(dbTrial).not.toBeNull();
    });

    it("lets supervisors change a trial's status", async () => {
      await seedStaff("supervisor");
      await request(app.getHttpServer())
        .patch(`/trial-bookings/${testTrialId}/status`)
        .set("x-mock-auth-id", "test-supervisor")
        .send({ status: "cancelled" })
        .expect(200);
    });

    it("blocks supervisors from deleting a trial", async () => {
      await seedStaff("supervisor");
      await request(app.getHttpServer())
        .delete(`/trial-bookings/${testTrialId}`)
        .set("x-mock-auth-id", "test-supervisor")
        .expect(403);

      const dbTrial = await prisma.trialBooking.findUnique({ where: { id: testTrialId } });
      expect(dbTrial).not.toBeNull();
    });

    it("lets managers delete a trial and records it in the audit log", async () => {
      const manager = await seedStaff("manager");
      await request(app.getHttpServer())
        .delete(`/trial-bookings/${testTrialId}`)
        .set("x-mock-auth-id", "test-manager")
        .expect(200);

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: testTrialId, action: "Delete Trial Booking" },
      });
      expect(audit?.staffId).toBe(manager.id);
    });
  });
});
