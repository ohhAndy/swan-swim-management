import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("SkipsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testEnrollmentId: string;
  let testSessionId: string;

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

    const session = await prisma.classSession.create({
      data: {
        offeringId: offering.id,
        date: new Date(),
        status: "scheduled"
      }
    });
    testSessionId = session.id;

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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /enrollments/:enrollmentId/skips", () => {
    it("should add a skip", async () => {
      await request(app.getHttpServer())
        .post(`/enrollments/${testEnrollmentId}/skips`)
        .send({ classSessionId: testSessionId })
        .expect(201);
      
      await prisma.enrollmentSkip.findUniqueOrThrow({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: testEnrollmentId,
            classSessionId: testSessionId,
          }
        }
      });
    });
  });

  describe("DELETE /enrollments/:enrollmentId/skips/:classSessionId", () => {
    it("should delete a skip", async () => {
      await prisma.enrollmentSkip.create({
        data: {
          enrollmentId: testEnrollmentId,
          classSessionId: testSessionId,
        }
      });

      await request(app.getHttpServer())
        .delete(`/enrollments/${testEnrollmentId}/skips/${testSessionId}`)
        .expect(200);
      
      const skip = await prisma.enrollmentSkip.findUnique({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: testEnrollmentId,
            classSessionId: testSessionId,
          }
        }
      });
      expect(skip).toBeNull();

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: "remove_skip", entityId: testEnrollmentId },
      });
      expect(auditLogs).toHaveLength(1);
    });

    it("succeeds without an audit entry when the skip does not exist", async () => {
      await request(app.getHttpServer())
        .delete(`/enrollments/${testEnrollmentId}/skips/${testSessionId}`)
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: "remove_skip", entityId: testEnrollmentId },
      });
      expect(auditLogs).toHaveLength(0);
    });
  });

  describe("enrollment status rules", () => {
    it("rejects skips on transferred enrollments", async () => {
      await prisma.enrollment.update({
        where: { id: testEnrollmentId },
        data: { status: "transferred" },
      });

      await request(app.getHttpServer())
        .post(`/enrollments/${testEnrollmentId}/skips`)
        .send({ classSessionId: testSessionId })
        .expect(400);
    });

    it("only lets admins change skips on inactive enrollments", async () => {
      await prisma.enrollment.update({
        where: { id: testEnrollmentId },
        data: { status: "inactive" },
      });
      await prisma.staffUser.create({
        data: {
          authId: "test-manager",
          email: "manager@test.com",
          role: "manager",
          fullName: "Test Manager",
          active: true,
        },
      });

      await request(app.getHttpServer())
        .post(`/enrollments/${testEnrollmentId}/skips`)
        .set("x-mock-auth-id", "test-manager")
        .send({ classSessionId: testSessionId })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/enrollments/${testEnrollmentId}/skips`)
        .send({ classSessionId: testSessionId })
        .expect(201);
    });
  });
});
