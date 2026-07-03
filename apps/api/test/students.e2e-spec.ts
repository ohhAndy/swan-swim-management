import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

describe("StudentsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testGuardianId: string;
  let testStudentId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const guardian = await seedGuardian(prisma);
    testGuardianId = guardian.id;

    // Create a test student
    const student = await prisma.student.create({
      data: {
        firstName: "Test",
        lastName: "Student",
        guardianId: testGuardianId,
      },
    });
    testStudentId = student.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /students", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/students")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of students", async () => {
      const response = await request(app.getHttpServer())
        .get("/students")
        .expect(200);
      
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.some((s: { id: string }) => s.id === testStudentId)).toBe(true);
    });
  });

  describe("GET /students/:id", () => {
    it("should return a student by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/students/${testStudentId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testStudentId);
      expect(response.body.firstName).toBe("Test");
    });
  });

  describe("POST /students", () => {
    it("should create a new student", async () => {
      const response = await request(app.getHttpServer())
        .post("/students")
        .send({
          firstName: "New",
          lastName: "Kid",
          guardianId: testGuardianId,
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.firstName).toBe("New");
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
        .post("/students")
        .set("x-mock-auth-id", "test-viewer")
        .send({
          firstName: "New",
          lastName: "Kid",
          guardianId: testGuardianId,
        })
        .expect(403);
    });
  });

  describe("PATCH /students/:id", () => {
    it("should update a student", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/students/${testStudentId}`)
        .send({
          firstName: "UpdatedName",
        })
        .expect(200);
      
      expect(response.body.firstName).toBe("UpdatedName");
    });
  });

  describe("PUT /students/:id/notes", () => {
    it("should update student notes", async () => {
      const response = await request(app.getHttpServer())
        .put(`/students/${testStudentId}/notes`)
        .send({
          notes: "These are new notes",
        })
        .expect(200);
      
      expect(response.body.notes).toBe("These are new notes");
    });
  });

  describe("DELETE /students/:id", () => {
    it("should delete a student", async () => {
      await request(app.getHttpServer())
        .delete(`/students/${testStudentId}`)
        .expect(200);
      
      const dbStudent = await prisma.student.findUnique({ where: { id: testStudentId } });
      expect(dbStudent).toBeNull();
    });
  });
});
