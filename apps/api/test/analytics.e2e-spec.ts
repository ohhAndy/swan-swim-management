import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm } from "./utils/seeds";

describe("AnalyticsController (e2e)", () => {
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

  describe("GET /analytics/financial/location", () => {
    it("should return revenue by location", async () => {
      const response = await request(app.getHttpServer())
        .get("/analytics/financial/location")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /analytics/financial/term", () => {
    it("should return revenue by term", async () => {
      const response = await request(app.getHttpServer())
        .get("/analytics/financial/term")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /analytics/financial/term/:id", () => {
    it("should return term financial details", async () => {
      const response = await request(app.getHttpServer())
        .get(`/analytics/financial/term/${testTermId}`)
        .expect(200);
      
      expect(response.body.totalRevenue).toBeDefined();
    });
  });
});
