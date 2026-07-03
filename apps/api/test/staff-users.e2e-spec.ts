import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("StaffUsersController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    // RolesGuard requires the authenticated user to exist in the database
    await seedAdmin(prisma);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /staff-users", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/staff-users")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of staff users", async () => {
      const response = await request(app.getHttpServer())
        .get("/staff-users")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((u: { email: string }) => u.email === "admin@test.com")).toBe(true);
    });

    it("should reject users without admin/super_admin role", async () => {
      // Create a viewer user
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
        .get("/staff-users")
        .set("x-mock-auth-id", "test-viewer")
        .expect(403);
    });
  });

  describe("GET /staff-users/by-auth/:authId", () => {
    it("should return staff user by authId without requiring authentication", async () => {
      const response = await request(app.getHttpServer())
        .get("/staff-users/by-auth/test-admin")
        .set("x-mock-unauthorized", "true") // Still works because it's @Public()
        .expect(200);
      
      expect(response.body.authId).toBe("test-admin");
    });
  });

  describe("POST /staff-users", () => {
    it("should create a new staff user", async () => {
      const response = await request(app.getHttpServer())
        .post("/staff-users")
        .send({
          authId: "new-user",
          email: "new@test.com",
          fullName: "New User",
          role: "manager",
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.authId).toBe("new-user");
      expect(response.body.role).toBe("manager");

      const dbUser = await prisma.staffUser.findUnique({ where: { authId: "new-user" } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.fullName).toBe("New User");
    });
  });

  describe("PATCH /staff-users/:id", () => {
    it("should update an existing staff user", async () => {
      const dbUser = await prisma.staffUser.findUnique({ where: { authId: "test-admin" } });
      expect(dbUser).toBeDefined();

      const response = await request(app.getHttpServer())
        .patch(`/staff-users/${dbUser!.id}`)
        .send({
          fullName: "Updated Admin Name",
        })
        .expect(200);
      
      expect(response.body.fullName).toBe("Updated Admin Name");
    });
  });
});
