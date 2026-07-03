import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("LevelsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testLevelId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test level
    const level = await prisma.level.create({
      data: {
        name: "Test Level",
        description: "Test Description",
        category: "Test Category",
        color: "#000000",
        order: 1,
      },
    });
    testLevelId = level.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /levels", () => {
    it("should return a list of levels", async () => {
      const response = await request(app.getHttpServer())
        .get("/levels")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((l: { id: string }) => l.id === testLevelId)).toBe(true);
    });
  });

  describe("GET /levels/:id", () => {
    it("should return a level by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/levels/${testLevelId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testLevelId);
      expect(response.body.name).toBe("Test Level");
    });
  });

  describe("POST /levels", () => {
    it("should create a new level", async () => {
      const response = await request(app.getHttpServer())
        .post("/levels")
        .send({
          name: "New Level",
          description: "New Description",
          category: "New Category",
          color: "#ffffff",
          order: 2,
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe("New Level");
    });
  });

  describe("PATCH /levels/:id", () => {
    it("should update a level", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/levels/${testLevelId}`)
        .send({
          name: "Updated Level Name",
        })
        .expect(200);
      
      expect(response.body.name).toBe("Updated Level Name");
    });
  });

  describe("DELETE /levels/:id", () => {
    it("should delete a level", async () => {
      await request(app.getHttpServer())
        .delete(`/levels/${testLevelId}`)
        .expect(200);
      
      const dbLevel = await prisma.level.findUnique({ where: { id: testLevelId } });
      expect(dbLevel).toBeNull();
    });
  });
});
