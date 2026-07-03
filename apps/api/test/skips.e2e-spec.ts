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
      
      const skip = await prisma.enrollmentSkip.findUnique({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: testEnrollmentId,
            classSessionId: testSessionId,
          }
        }
      });
      expect(skip).toBeDefined();
      expect(skip?.enrollmentId).toBe(testEnrollmentId);
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
    });
  });
});
