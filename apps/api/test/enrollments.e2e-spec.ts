import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("EnrollmentsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStudentId: string;
  let testOfferingId: string;
  let testTermId: string;
  let testEnrollmentId: string;

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
    testTermId = term.id;
    
    const offering = await seedClassOffering(prisma, testTermId);
    testOfferingId = offering.id;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: testStudentId,
        offeringId: testOfferingId,
        enrollDate: new Date(),
        status: "active",
        classRatio: "3:1",
      },
    });
    testEnrollmentId = enrollment.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /enrollments/uninvoiced", () => {
    it("should return uninvoiced enrollments", async () => {
      const response = await request(app.getHttpServer())
        .get("/enrollments/uninvoiced")
        .query({
          termId: testTermId,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("PUT /enrollments/:id/remarks", () => {
    it("should update remarks", async () => {
      await request(app.getHttpServer())
        .put(`/enrollments/${testEnrollmentId}/remarks`)
        .send({ remarks: "test remarks" })
        .expect(200);
      
      const dbEnrollment = await prisma.enrollment.findUnique({ where: { id: testEnrollmentId } });
      expect(dbEnrollment?.notes).toBe("test remarks");
    });
  });

  describe("PUT /enrollments/:id/report-card-status", () => {
    it("should update report card status", async () => {
      await request(app.getHttpServer())
        .put(`/enrollments/${testEnrollmentId}/report-card-status`)
        .send({ status: "sent" })
        .expect(200);
      
      const dbEnrollment = await prisma.enrollment.findUnique({ where: { id: testEnrollmentId } });
      expect(dbEnrollment?.reportCardStatus).toBe("sent");
    });
  });

  describe("DELETE /enrollments/:id", () => {
    it("should delete an enrollment", async () => {
      await request(app.getHttpServer())
        .delete(`/enrollments/${testEnrollmentId}`)
        .expect(200);
      
      const dbEnrollment = await prisma.enrollment.findUnique({ where: { id: testEnrollmentId } });
      expect(dbEnrollment).toBeNull();
    });
  });
});
