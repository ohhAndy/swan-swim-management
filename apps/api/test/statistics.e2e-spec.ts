import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm } from "./utils/seeds";

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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /statistics/dashboard", () => {
    it("should return dashboard stats", async () => {
      const response = await request(app.getHttpServer())
        .get(`/statistics/dashboard?termId=${testTermId}`)
        .expect(200);
      
      expect(response.body.studentCount).toBeDefined();
      expect(response.body.capacity).toBeDefined();
      expect(Array.isArray(response.body.studentsPerDay)).toBe(true);
      expect(response.body.levels).toBeDefined();
      expect(response.body.actionItems).toBeDefined();
    });
  });
});
