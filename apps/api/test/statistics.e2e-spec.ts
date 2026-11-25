import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedClassOffering, seedGuardian, seedTerm } from "./utils/seeds";

describe("StatisticsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTermId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const term = await seedTerm(prisma);
    testTermId = term.id;

    const guardian = await seedGuardian(prisma);
    const offering = await seedClassOffering(prisma, term.id);

    const createStudent = (firstName: string, level: string | null) =>
      prisma.student.create({
        data: { firstName, lastName: "Student", guardianId: guardian.id, level },
      });
    const [active, inactive, transferred] = await Promise.all([
      createStudent("Active", "Level 3"),
      createStudent("Inactive", null),
      createStudent("Transferred", "Level 5"),
    ]);

    await prisma.enrollment.createMany({
      data: [
        { studentId: active.id, offeringId: offering.id, status: "active", classRatio: "3:1" },
        { studentId: inactive.id, offeringId: offering.id, status: "inactive", classRatio: "1:1" },
        { studentId: transferred.id, offeringId: offering.id, status: "transferred", classRatio: "3:1" },
      ],
    });

    const day = 24 * 60 * 60 * 1000;
    await prisma.classSession.createMany({
      data: [
        { offeringId: offering.id, date: new Date(Date.now() - 7 * day), status: "scheduled" },
        { offeringId: offering.id, date: new Date(Date.now() + 7 * day), status: "scheduled" },
      ],
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /statistics/dashboard", () => {
    it("returns enrollment fill from active students and seat use from past lessons", async () => {
      const response = await request(app.getHttpServer())
        .get(`/statistics/dashboard?termId=${testTermId}`)
        .expect(200);

      expect(response.body).toEqual({
        studentCount: 2,
        capacity: { total: 10, filled: 1, percentage: 10 },
        utilization: {
          sessions: 1,
          seatsOffered: 10,
          seatsUsed: 1,
          emptySeats: 9,
          percentage: 10,
        },
        studentsPerDay: [0, 2, 0, 0, 0, 0, 0],
        levels: { "Level 3": 1, Unknown: 1 },
        actionItems: { pendingMakeups: 0, upcomingTrials: 0 },
      });
    });
  });

  describe("input validation", () => {
    it("returns 400 when termId is missing", () => {
      return request(app.getHttpServer())
        .get("/statistics/dashboard")
        .expect(400);
    });
  });
});
