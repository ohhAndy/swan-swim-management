import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("SkillsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testLevelId: string;
  let testSkillId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test level first since skills belong to a level
    const level = await prisma.level.create({
      data: {
        name: "Test Level for Skills",
        description: "Test Description",
        category: "Test Category",
        color: "#000000",
        order: 1,
      },
    });
    testLevelId = level.id;

    // Create a test skill
    const skill = await prisma.skill.create({
      data: {
        description: "Test Skill Description",
        levelId: testLevelId,
        order: 1,
      },
    });
    testSkillId = skill.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /skills", () => {
    it("should return a list of skills", async () => {
      const response = await request(app.getHttpServer())
        .get("/skills")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((s: { id: string }) => s.id === testSkillId)).toBe(true);
    });
  });

  describe("GET /skills/:id", () => {
    it("should return a skill by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills/${testSkillId}`)
        .expect(200);
      
      expect(response.body.description).toBe("Test Skill Description");
    });
  });

  describe("POST /skills", () => {
    it("should create a new skill", async () => {
      const response = await request(app.getHttpServer())
        .post("/skills")
        .send({
          description: "New Skill Description",
          levelId: testLevelId,
          order: 2,
        })
        .expect(201);
      
      expect(response.body.description).toBe("New Skill Description");
    });
  });

  describe("PATCH /skills/:id", () => {
    it("should update a skill", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/skills/${testSkillId}`)
        .send({
          description: "Updated Skill Description",
        })
        .expect(200);
      expect(response.body.description).toBe("Updated Skill Description");
    });
  });

  describe("DELETE /skills/:id", () => {
    it("should delete a skill", async () => {
      await request(app.getHttpServer())
        .delete(`/skills/${testSkillId}`)
        .expect(200);
      
      const dbSkill = await prisma.skill.findUnique({ where: { id: testSkillId } });
      expect(dbSkill).toBeNull();
    });
  });
});
