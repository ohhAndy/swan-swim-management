import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

describe("MakeupsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStudentId: string;
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
    testStudentId = student.id;

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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /makeups", () => {
    it("should create a makeup booking", async () => {
      await request(app.getHttpServer())
        .post(`/makeups`)
        .send({
          studentId: testStudentId,
          classSessionId: testSessionId,
          notes: "makeup test"
        })
        .expect(201);
      
      const makeup = await prisma.makeUpBooking.findFirst({
        where: {
          studentId: testStudentId,
          classSessionId: testSessionId,
        }
      });
      expect(makeup).toBeDefined();
      expect(makeup?.notes).toBe("makeup test");
    });
  });
});
