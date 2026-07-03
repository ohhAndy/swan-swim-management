import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm } from "./utils/seeds";

describe("TermsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTermId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    // Seed the database with a test user and a test term
    await seedAdmin(prisma);
    const term = await seedTerm(prisma);
    testTermId = term.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /terms/all", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/terms/all")
        .set("x-mock-unauthorized", "true")
        .expect(401); // Throws UnauthorizedException now
    });

    it("should return a list of terms", async () => {
      const response = await request(app.getHttpServer())
        .get("/terms/all")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((t: { id: string }) => t.id === testTermId)).toBe(true);
    });
  });

  describe("GET /terms/:termId", () => {
    it("should return the term title", async () => {
      const response = await request(app.getHttpServer())
        .get(`/terms/${testTermId}`)
        .expect(200);
      
      expect(response.text).toBe("Test Term");
    });

    it("should return 404 for unknown term", () => {
      return request(app.getHttpServer())
        .get(`/terms/non-existent-id`)
        .expect(404);
    });
  });
});
