import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
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
    it("should email a report card", async () => {
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
