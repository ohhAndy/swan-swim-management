import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("TasksController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTaskId: string;
  let adminUserId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    const admin = await seedAdmin(prisma);
    adminUserId = admin.id;

    const task = await prisma.task.create({
      data: {
        title: "Test Task",
        description: "Test description",
        assignedTo: { connect: { id: adminUserId } },
        createdBy: { connect: { id: adminUserId } },
      }
    });
    testTaskId = task.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /tasks", () => {
    it("should return a list of tasks", async () => {
      const response = await request(app.getHttpServer())
        .get("/tasks")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /tasks/:id", () => {
    it("should return a task by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testTaskId);
    });
  });

  describe("POST /tasks", () => {
    it("should create a task", async () => {
      const response = await request(app.getHttpServer())
        .post("/tasks")
        .send({
          title: "New Task",
          description: "New description",
          priority: "medium",
          assignedToId: adminUserId
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });
  });

  describe("PATCH /tasks/:id", () => {
    it("should update a task", async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .send({ title: "Updated title" })
        .expect(200);
      
      const dbTask = await prisma.task.findUnique({ where: { id: testTaskId } });
      expect(dbTask?.title).toBe("Updated title");
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("should delete a task", async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${testTaskId}`)
        .expect(200);
      
      const dbTask = await prisma.task.findUnique({ where: { id: testTaskId } });
      expect(dbTask).toBeNull();
    });
  });
});
