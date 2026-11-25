import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedSuperAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";
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

    it("returns 404 for a missing task", () => {
      return request(app.getHttpServer())
        .delete("/tasks/does-not-exist")
        .expect(404);
    });
  });

  describe("access control", () => {
    it("lets a super_admin see and update tasks created by others", async () => {
      await seedSuperAdmin(prisma);

      const list = await request(app.getHttpServer())
        .get("/tasks")
        .set("x-mock-auth-id", "test-superadmin")
        .expect(200);
      expect(list.body.map((t: { id: string }) => t.id)).toContain(testTaskId);

      await request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .set("x-mock-auth-id", "test-superadmin")
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set("x-mock-auth-id", "test-superadmin")
        .send({ title: "Edited by super admin" })
        .expect(200);
    });

    it("hides other people's tasks from a supervisor", async () => {
      await prisma.staffUser.create({
        data: {
          authId: "test-supervisor",
          email: "supervisor@test.com",
          role: "supervisor",
          fullName: "Test Supervisor",
          active: true,
        },
      });

      const list = await request(app.getHttpServer())
        .get("/tasks")
        .set("x-mock-auth-id", "test-supervisor")
        .expect(200);
      expect(list.body).toEqual([]);

      await request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .set("x-mock-auth-id", "test-supervisor")
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set("x-mock-auth-id", "test-supervisor")
        .send({ title: "Not allowed" })
        .expect(403);

      const dbTask = await prisma.task.findUniqueOrThrow({ where: { id: testTaskId } });
      expect(dbTask.title).toBe("Test Task");
    });

    it("returns 404 when updating a missing task", () => {
      return request(app.getHttpServer())
        .patch("/tasks/does-not-exist")
        .send({ title: "x" })
        .expect(404);
    });

    it("only exposes id and fullName of the assigned and creating staff", async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .expect(200);

      expect(response.body.assignedTo).toEqual({ id: adminUserId, fullName: "Test Admin" });
      expect(response.body.createdBy).toEqual({ id: adminUserId, fullName: "Test Admin" });
    });
  });

  describe("PATCH /tasks/:id", () => {
    it("ignores fields that are not part of a task update", async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .send({ title: "Renamed", createdById: "someone-else" })
        .expect(200);

      const task = await prisma.task.findUnique({ where: { id: testTaskId } });
      expect(task?.title).toBe("Renamed");
      expect(task?.createdById).toBe(adminUserId);
    });

    it("rejects an unknown priority", () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .send({ priority: "whenever" })
        .expect(400);
    });
  });
});
