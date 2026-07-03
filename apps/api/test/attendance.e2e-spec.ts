import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("AttendanceController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testEnrollmentId: string;
  let testSessionId: string;
  let testMakeupId: string;

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

    const makeup = await prisma.makeUpBooking.create({
      data: {
        studentId: student.id,
        classSessionId: testSessionId,
        status: "scheduled",
      }
    });
    testMakeupId = makeup.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("PUT /attendance", () => {
    it("should upsert attendance", async () => {
      await request(app.getHttpServer())
        .put("/attendance")
        .send({
          enrollmentId: testEnrollmentId,
          classSessionId: testSessionId,
          status: "present",
          notes: "test notes",
        })
        .expect(200);
      
      const attendance = await prisma.attendance.findUnique({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: testEnrollmentId,
            classSessionId: testSessionId,
          }
        }
      });
      expect(attendance).toBeDefined();
      expect(attendance?.status).toBe("present");
    });
  });

  describe("PATCH /attendance/makeup", () => {
    it("should update makeup status", async () => {
      await request(app.getHttpServer())
        .patch("/attendance/makeup")
        .send({
          makeUpId: testMakeupId,
          status: "attended",
        })
        .expect(200);
      
      const dbMakeup = await prisma.makeUpBooking.findUnique({ where: { id: testMakeupId } });
      expect(dbMakeup?.status).toBe("attended");
    });
  });
});
