import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm, seedClassOffering, seedInstructor } from "./utils/seeds";

describe("ClassInstructorsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTermId: string;
  let testOfferingId: string;
  let testInstructorId: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    const term = await seedTerm(prisma);
    testTermId = term.id;

    const offering = await seedClassOffering(prisma, testTermId);
    testOfferingId = offering.id;

    const instructor = await seedInstructor(prisma);
    testInstructorId = instructor.id;

    // Create a pre-existing assignment
    const assignment = await prisma.classInstructor.create({
      data: {
        classOfferingId: testOfferingId,
        instructorId: testInstructorId,
      },
    });
    testAssignmentId = assignment.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /class-instructors", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .post("/class-instructors")
        .set("x-mock-unauthorized", "true")
        .send({ classOfferingId: testOfferingId, instructorId: testInstructorId })
        .expect(401);
    });

    it("should assign an instructor to a class", async () => {
      const instructor2 = await seedInstructor(prisma, "Second", "Instructor");

      const response = await request(app.getHttpServer())
        .post("/class-instructors")
        .send({
          classOfferingId: testOfferingId,
          instructorId: instructor2.id,
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.classOfferingId).toBe(testOfferingId);
      expect(response.body.instructorId).toBe(instructor2.id);
    });
  });

  describe("GET /class-instructors/class/:classOfferingId", () => {
    it("should return active instructors for a class", async () => {
      const response = await request(app.getHttpServer())
        .get(`/class-instructors/class/${testOfferingId}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((a: { instructorId: string }) => a.instructorId === testInstructorId)).toBe(true);
    });
  });

  describe("GET /class-instructors/class/:classOfferingId/history", () => {
    it("should return instructor history for a class", async () => {
      const response = await request(app.getHttpServer())
        .get(`/class-instructors/class/${testOfferingId}/history`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /class-instructors/instructor/:instructorId", () => {
    it("should return classes for an instructor", async () => {
      const response = await request(app.getHttpServer())
        .get(`/class-instructors/instructor/${testInstructorId}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("DELETE /class-instructors/:id", () => {
    it("should remove an instructor assignment (soft delete)", async () => {
      await request(app.getHttpServer())
        .delete(`/class-instructors/${testAssignmentId}`)
        .expect(200);
      
      const dbAssignment = await prisma.classInstructor.findUnique({ where: { id: testAssignmentId } });
      expect(dbAssignment).toBeDefined();
      expect(dbAssignment!.removedAt).not.toBeNull();
    });
  });
});
