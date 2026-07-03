import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm, seedClassOffering } from "./utils/seeds";

describe("SessionsController (e2e)", () => {
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
    await seedClassOffering(prisma, testTermId);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /sessions/slot", () => {
    it("should return seats for a specific slot", async () => {
      const response = await request(app.getHttpServer())
        .get("/sessions/slot")
        .query({
          termId: testTermId,
          weekday: "1",
          startTime: "09:00",
          date: new Date().toISOString().split("T")[0],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty("offeringId");
        expect(response.body[0]).toHaveProperty("seats");
      }
    });
  });
});
