import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm, seedClassOffering } from "./utils/seeds";

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

    it("rejects a booking without a child name", () => {
      return request(app.getHttpServer())
        .post("/trial-bookings")
        .send({ classSessionId: "s", childName: "", childAge: 5, parentPhone: "555" })
        .expect(400);
    });
  });
});
