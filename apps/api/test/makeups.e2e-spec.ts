import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("MakeupsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStudentId: string;
  let testOfferingId: string;

  /** Helper to create a fresh session for each test to avoid unique constraint collisions */
  async function createSession(): Promise<string> {
    const session = await prisma.classSession.create({
      data: {
        offeringId: testOfferingId,
        date: new Date(Date.now() + Math.random() * 1e9),
        status: "scheduled",
      },
    });
    return session.id;
  }

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const guardian = await seedGuardian(prisma);
    const student = await prisma.student.create({
      data: {
        firstName: "Test",
        lastName: "Student",
        guardianId: guardian.id,
      },
    });
    testStudentId = student.id;

    const term = await seedTerm(prisma);
    const offering = await seedClassOffering(prisma, term.id);
    testOfferingId = offering.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /makeups with tokens and overrides", () => {
    it("should prompt for override (HTTP 200) when student has no tokens", async () => {
      const sessionId = await createSession();

      const res = await request(app.getHttpServer())
        .post(`/makeups`)
        .send({
          studentId: testStudentId,
          classSessionId: sessionId,
          notes: "no tokens yet",
          overrideAcknowledged: false,
        })
        .expect(200);

      expect(res.body.requiresOverride).toBe(true);
      expect(res.body.tokenBalance.available).toBe(0);
    });

    it("should create a makeup booking with staff override when overrideAcknowledged is true", async () => {
      const sessionId = await createSession();

      const res = await request(app.getHttpServer())
        .post(`/makeups`)
        .send({
          studentId: testStudentId,
          classSessionId: sessionId,
          notes: "override booking",
          overrideAcknowledged: true,
        })
        .expect(201);

      expect(res.body.isOverride).toBe(true);
      expect(res.body.tokenId).toBeNull();

      const makeup = await prisma.makeUpBooking.findFirst({
        where: {
          studentId: testStudentId,
          classSessionId: sessionId,
        },
      });
      expect(makeup).toBeDefined();
      expect(makeup?.isOverride).toBe(true);
      expect(makeup?.notes).toBe("override booking");
    });

    it("should consume an available token when student is enrolled with tokens", async () => {
      const sessionId = await createSession();

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: testStudentId,
          offeringId: testOfferingId,
          status: "active",
        },
      });

      const token1 = await prisma.makeUpToken.create({
        data: {
          enrollmentId: enrollment.id,
          status: "available",
          notes: "Initial grant",
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/makeups`)
        .send({
          studentId: testStudentId,
          classSessionId: sessionId,
          notes: "token-backed booking",
        })
        .expect(201);

      expect(res.body.isOverride).toBe(false);
      expect(res.body.tokenId).toBe(token1.id);

      const consumedToken = await prisma.makeUpToken.findUnique({
        where: { id: token1.id },
      });
      expect(consumedToken?.status).toBe("consumed");
      expect(consumedToken?.consumedAt).toBeDefined();
    });
  });

  describe("GET /tokens/student/:studentId/balance", () => {
    it("should return correct token balance", async () => {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: testStudentId,
          offeringId: testOfferingId,
          status: "active",
        },
      });

      await prisma.makeUpToken.createMany({
        data: [
          { enrollmentId: enrollment.id, status: "available" },
          { enrollmentId: enrollment.id, status: "available" },
        ],
      });

      const res = await request(app.getHttpServer())
        .get(`/tokens/student/${testStudentId}/balance`)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.available).toBe(2);
      expect(res.body.consumed).toBe(0);
    });
  });

  describe("POST /tokens/grant", () => {
    it("should grant extra tokens to an enrollment", async () => {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: testStudentId,
          offeringId: testOfferingId,
          status: "active",
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/tokens/grant`)
        .send({
          enrollmentId: enrollment.id,
          count: 2,
          notes: "Medical exception",
        })
        .expect(201);

      expect(res.body).toHaveLength(2);

      const tokens = await prisma.makeUpToken.findMany({
        where: { enrollmentId: enrollment.id },
      });
      expect(tokens).toHaveLength(2);
      expect(tokens.every((t) => t.status === "available")).toBe(true);
    });
  });

  describe("DELETE /tokens/:tokenId (void)", () => {
    it("should void an available token", async () => {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: testStudentId,
          offeringId: testOfferingId,
          status: "active",
        },
      });

      const token = await prisma.makeUpToken.create({
        data: {
          enrollmentId: enrollment.id,
          status: "available",
          notes: "Test token",
        },
      });

      const res = await request(app.getHttpServer())
        .delete(`/tokens/${token.id}`)
        .send({ notes: "Granted by mistake" })
        .expect(200);

      expect(res.body.status).toBe("voided");

      const voidedToken = await prisma.makeUpToken.findUnique({
        where: { id: token.id },
      });
      expect(voidedToken?.status).toBe("voided");
    });

    it("should reject voiding a consumed token", async () => {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: testStudentId,
          offeringId: testOfferingId,
          status: "active",
        },
      });

      const token = await prisma.makeUpToken.create({
        data: {
          enrollmentId: enrollment.id,
          status: "consumed",
          consumedAt: new Date(),
          notes: "Already used",
        },
      });

      await request(app.getHttpServer())
        .delete(`/tokens/${token.id}`)
        .send({ notes: "Try to void" })
        .expect(400);
    });
  });
});

