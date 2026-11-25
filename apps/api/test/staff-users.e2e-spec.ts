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

  describe("GET /staff-users/me", () => {
    it("returns the authenticated staff user", async () => {
      const response = await request(app.getHttpServer())
        .get("/staff-users/me")
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        authId: "test-admin",
        email: "admin@test.com",
        fullName: "Test Admin",
        role: "admin",
        active: true,
      });
    });

    it("rejects unauthenticated requests", () => {
      return request(app.getHttpServer())
        .get("/staff-users/me")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("rejects inactive staff users", async () => {
      await prisma.staffUser.create({
        data: {
          authId: "test-inactive",
          email: "inactive@test.com",
          role: "manager",
          fullName: "Inactive Manager",
          active: false,
        },
      });

      return request(app.getHttpServer())
        .get("/staff-users/me")
        .set("x-mock-auth-id", "test-inactive")
        .expect(403);
    });
  });

  it("no longer exposes the public by-auth lookup", () => {
    return request(app.getHttpServer())
      .get("/staff-users/by-auth/test-admin")
      .set("x-mock-unauthorized", "true")
      .expect(404);
  });

  describe("write endpoints", () => {
    it("does not expose POST /staff-users", async () => {
      await request(app.getHttpServer())
        .post("/staff-users")
        .send({
          authId: "new-user",
          email: "new@test.com",
          fullName: "New User",
          role: "super_admin",
        })
        .expect(404);

      const dbUser = await prisma.staffUser.findUnique({ where: { authId: "new-user" } });
      expect(dbUser).toBeNull();
    });

    it("does not expose PATCH /staff-users/:id", async () => {
      const dbUser = await prisma.staffUser.findUniqueOrThrow({ where: { authId: "test-admin" } });

      await request(app.getHttpServer())
        .patch(`/staff-users/${dbUser.id}`)
        .send({ role: "super_admin" })
        .expect(404);

      const after = await prisma.staffUser.findUniqueOrThrow({ where: { id: dbUser.id } });
      expect(after.role).toBe(dbUser.role);
    });
  });
});
