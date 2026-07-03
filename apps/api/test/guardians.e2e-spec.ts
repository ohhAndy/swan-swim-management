import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("GuardiansController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testGuardianId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test guardian
    const guardian = await prisma.guardian.create({
      data: {
        fullName: "Test Guardian",
        shortCode: "TESTG1",
        email: "guardian@test.com",
        phone: "555-123-4567",
      },
    });
    testGuardianId = guardian.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /guardians", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/guardians")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of guardians", async () => {
      const response = await request(app.getHttpServer())
        .get("/guardians")
        .expect(200);
      
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.some((g: { id: string }) => g.id === testGuardianId)).toBe(true);
    });

    it("should search guardians by name", async () => {
      const response = await request(app.getHttpServer())
        .get("/guardians?search=Guardian")
        .expect(200);
      
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /guardians/:id", () => {
    it("should return a guardian by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/guardians/${testGuardianId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testGuardianId);
      expect(response.body.fullName).toBe("Test Guardian");
    });
  });

  describe("POST /guardians", () => {
    it("should create a new guardian", async () => {
      const response = await request(app.getHttpServer())
        .post("/guardians")
        .send({
          fullName: "New Parent",
          email: "newparent@test.com",
          phone: "555-987-6543",
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe("newparent@test.com");
    });

    it("should reject users without required role", async () => {
      await prisma.staffUser.create({
        data: {
          authId: "test-viewer",
          email: "viewer@test.com",
          role: "viewer",
          fullName: "Test Viewer",
          active: true,
        },
      });

      return request(app.getHttpServer())
        .post("/guardians")
        .set("x-mock-auth-id", "test-viewer")
        .send({
          fullName: "New Parent",
          phone: "555-123-4567",
        })
        .expect(403);
    });
  });

  describe("PATCH /guardians/:id", () => {
    it("should update a guardian", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/guardians/${testGuardianId}`)
        .send({
          fullName: "Updated Name",
        })
        .expect(200);
      
      expect(response.body.fullName).toBe("Updated Name");
    });
  });

  describe("DELETE /guardians/:id", () => {
    it("should delete a guardian", async () => {
      await request(app.getHttpServer())
        .delete(`/guardians/${testGuardianId}`)
        .expect(200);
      
      const dbGuardian = await prisma.guardian.findUnique({ where: { id: testGuardianId } });
      expect(dbGuardian).toBeNull();
    });
  });
});
