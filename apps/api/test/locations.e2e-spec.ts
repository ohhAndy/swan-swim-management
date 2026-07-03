import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("LocationsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testLocationId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test location
    const location = await prisma.location.create({
      data: {
        name: "Test Location",
        slug: "test-location",
        address: "123 Test St",
      },
    });
    testLocationId = location.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /locations", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/locations")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of locations for admin", async () => {
      const response = await request(app.getHttpServer())
        .get("/locations")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((l: { id: string }) => l.id === testLocationId)).toBe(true);
    });
  });
});
