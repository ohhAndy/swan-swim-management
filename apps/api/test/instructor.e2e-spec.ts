import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("InstructorsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testInstructorId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test instructor
    const instructor = await prisma.instructor.create({
      data: {
        firstName: "Test",
        lastName: "Instructor",
        email: "instructor@test.com",
        isActive: true,
      },
    });
    testInstructorId = instructor.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /instructors", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/instructors")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of instructors", async () => {
      const response = await request(app.getHttpServer())
        .get("/instructors")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((i: { id: string }) => i.id === testInstructorId)).toBe(true);
    });
  });

  describe("GET /instructors/:id", () => {
    it("should return an instructor by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/instructors/${testInstructorId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testInstructorId);
      expect(response.body.firstName).toBe("Test");
    });
  });

  describe("POST /instructors", () => {
    it("should create a new instructor", async () => {
      const response = await request(app.getHttpServer())
        .post("/instructors")
        .send({
          firstName: "New",
          lastName: "Coach",
          email: "coach@test.com",
          isActive: true,
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
        .post("/instructors")
        .set("x-mock-auth-id", "test-viewer")
        .send({
          firstName: "New",
          lastName: "Coach",
        })
        .expect(403);
    });
  });

  describe("PATCH /instructors/:id", () => {
    it("should update an instructor", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/instructors/${testInstructorId}`)
        .send({
          firstName: "UpdatedName",
        })
        .expect(200);
      
      expect(response.body.firstName).toBe("UpdatedName");
    });
  });

  describe("DELETE /instructors/:id", () => {
    it("should delete an instructor", async () => {
      await request(app.getHttpServer())
        .delete(`/instructors/${testInstructorId}`)
        .expect(200);
      
      const dbInstructor = await prisma.instructor.findUnique({ where: { id: testInstructorId } });
      expect(dbInstructor).toBeDefined();
      expect(dbInstructor!.isActive).toBe(false);
    });
  });
});
