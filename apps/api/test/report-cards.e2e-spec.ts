import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { CommunicationsService } from "../src/communications/communications.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("ReportCardsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testReportCardId: string;
  let testEnrollmentId: string;
  let testLevelId: string;

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

    const term = await seedTerm(prisma);
    const offering = await seedClassOffering(prisma, term.id);

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        offeringId: offering.id,
        enrollDate: new Date(),
        status: "active",
        classRatio: "3:1",
      },
    });
    testEnrollmentId = enrollment.id;

    const level = await prisma.level.create({
      data: {
        name: "Level 1"
      }
    });
    testLevelId = level.id;

    const reportCard = await prisma.reportCard.create({
      data: {
        enrollmentId: testEnrollmentId,
        levelId: testLevelId,
        status: "draft",
      }
    });
    testReportCardId = reportCard.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /report-cards", () => {
    it("should return a list of report cards", async () => {
      const response = await request(app.getHttpServer())
        .get("/report-cards")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /report-cards/:id", () => {
    it("should return a report card by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/report-cards/${testReportCardId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testReportCardId);
    });
  });

  describe("POST /report-cards", () => {
    it("should create a report card", async () => {
      const response = await request(app.getHttpServer())
        .post("/report-cards")
        .send({
          enrollmentId: testEnrollmentId,
          levelId: testLevelId,
          status: "draft",
          skills: []
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });
  });

  describe("PATCH /report-cards/:id", () => {
    it("should update a report card", async () => {
      await request(app.getHttpServer())
        .patch(`/report-cards/${testReportCardId}`)
        .send({ comments: "Good job" })
        .expect(200);
      
      const dbReportCard = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(dbReportCard?.comments).toBe("Good job");
    });

    it("should allow supervisor to update a report card created by someone else", async () => {
      const creator = await prisma.staffUser.create({
        data: {
          authId: "test-creator",
          email: "creator@test.com",
          role: "admin",
          fullName: "Test Creator",
          active: true,
        },
      });

      await prisma.staffUser.create({
        data: {
          authId: "test-supervisor",
          email: "supervisor@test.com",
          role: "supervisor",
          fullName: "Test Supervisor",
          active: true,
        },
      });

      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { createdBy: creator.id }
      });

      await request(app.getHttpServer())
        .patch(`/report-cards/${testReportCardId}`)
        .set("x-mock-auth-id", "test-supervisor")
        .set("x-mock-email", "supervisor@test.com")
        .send({ comments: "Supervisor updated this" })
        .expect(200);

      const dbReportCard = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(dbReportCard?.comments).toBe("Supervisor updated this");
    });
  });

  describe("POST /report-cards/:id/email", () => {
    it("should reject emailing a draft report card", async () => {
      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(400);

      const dbReportCard = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(dbReportCard?.status).toBe("draft");
    });

    it("should email a completed report card and upgrade the student", async () => {
      const nextLevel = await prisma.level.create({ data: { name: "Level 2", order: 1 } });
      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { status: "completed" },
      });

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(201);

      const dbReportCard = await prisma.reportCard.findUnique({
        where: { id: testReportCardId },
        include: { enrollment: { include: { student: true } } },
      });
      expect(dbReportCard?.status).toBe("sent");
      expect(dbReportCard?.enrollment.student.levelId).toBe(nextLevel.id);
    });

    it("should reject setting status to sent via PATCH", async () => {
      await request(app.getHttpServer())
        .patch(`/report-cards/${testReportCardId}`)
        .send({ status: "sent" })
        .expect(400);
    });

    it("should reject a request without pdfContent", async () => {
      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { status: "completed" },
      });

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({})
        .expect(400);
    });

    it("should keep a card resendable when the provider fails, then succeed on retry", async () => {
      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { status: "completed" },
      });

      const sendSpy = jest
        .spyOn(CommunicationsService.prototype, "sendEmail")
        .mockResolvedValueOnce({
          success: false,
          total: 1,
          successCount: 0,
          failureCount: 1,
          status: "failed",
          logId: "log-failed",
          mock: false,
          results: [
            {
              email: "guardian@test.com",
              status: "failed",
              error: "Rate limit exceeded",
              updatedAt: new Date().toISOString(),
            },
          ],
        });

      const failed = await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(502);
      expect(failed.body.message).toContain("Rate limit exceeded");

      let card = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(card?.status).toBe("completed");
      expect(card?.lastSendStatus).toBe("failed");
      expect(card?.lastSendError).toBe("Rate limit exceeded");
      expect(card?.sendAttempts).toBe(1);

      sendSpy.mockRestore();

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(201);

      card = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(card?.status).toBe("sent");
      expect(card?.lastSendStatus).toBe("sent");
      expect(card?.lastSendError).toBeNull();
      expect(card?.sendAttempts).toBe(2);
      expect(card?.communicationLogId).toBeTruthy();
    });

    it("should require force to re-send a delivered card", async () => {
      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { status: "sent", lastSendStatus: "delivered" },
      });

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64", force: true })
        .expect(201);

      const card = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(card?.lastSendStatus).toBe("sent");
    });

    it("should allow retrying a sent card whose email bounced", async () => {
      await prisma.reportCard.update({
        where: { id: testReportCardId },
        data: { status: "sent", lastSendStatus: "bounced" },
      });

      await request(app.getHttpServer())
        .post(`/report-cards/${testReportCardId}/email`)
        .send({ pdfContent: "base64" })
        .expect(201);
    });
  });

  describe("DELETE /report-cards/:id", () => {
    it("should delete a report card", async () => {
      await request(app.getHttpServer())
        .delete(`/report-cards/${testReportCardId}`)
        .expect(200);
      
      const dbReportCard = await prisma.reportCard.findUnique({ where: { id: testReportCardId } });
      expect(dbReportCard).toBeNull();
    });
  });
});
