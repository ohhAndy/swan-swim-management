import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";
import { getBusinessTodayUtcMidnight } from "../src/tasks/cron-tasks.service";

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

  describe("POST /tasks/cron/deactivate-expired", () => {
    it("deactivates enrollments only for terms that ended before today", async () => {
      const guardian = await seedGuardian(prisma);
      const student = await prisma.student.create({
        data: { firstName: "Cron", lastName: "Student", guardianId: guardian.id },
      });

      const today = getBusinessTodayUtcMidnight();
      const day = 86400000;
      const pastTerm = await seedTerm(
        prisma,
        "Ended Term",
        new Date(today.getTime() - 60 * day),
        new Date(today.getTime() - day),
      );
      const endsTodayTerm = await seedTerm(
        prisma,
        "Ends Today Term",
        new Date(today.getTime() - 60 * day),
        today,
      );
      const futureTerm = await seedTerm(prisma, "Current Term");

      const makeEnrollment = async (termId: string) => {
        const offering = await seedClassOffering(prisma, termId);
        return prisma.enrollment.create({
          data: {
            studentId: student.id,
            offeringId: offering.id,
            enrollDate: new Date(),
            status: "active",
            classRatio: "3:1",
          },
        });
      };
      const pastEnr = await makeEnrollment(pastTerm.id);
      const todayEnr = await makeEnrollment(endsTodayTerm.id);
      const futureEnr = await makeEnrollment(futureTerm.id);

      const res = await request(app.getHttpServer())
        .post("/tasks/cron/deactivate-expired")
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);

      const statusOf = async (id: string) =>
        (await prisma.enrollment.findUnique({ where: { id }, select: { status: true } }))?.status;

      expect(await statusOf(pastEnr.id)).toBe("inactive");
      expect(await statusOf(todayEnr.id)).toBe("active");
      expect(await statusOf(futureEnr.id)).toBe("active");
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
