import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("LocationsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testLocationId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    // Create a test location
    const location = await prisma.location.create({
      data: {
        name: "Test Location",
        slug: "test-location",
        address: "123 Test St",
      },
    });
    testLocationId = location.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /locations", () => {
    it("should reject unauthorized requests", () => {
      return request(app.getHttpServer())
        .get("/locations")
        .set("x-mock-unauthorized", "true")
        .expect(401);
    });

    it("should return a list of locations for admin", async () => {
      // Create another location to verify admin gets both
      await prisma.location.create({
        data: {
          name: "Second Location",
          slug: "second-location",
          address: "456 Second St",
        },
      });

      const response = await request(app.getHttpServer())
        .get("/locations")
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.some((l: { id: string }) => l.id === testLocationId)).toBe(true);
    });

    it("should return only accessible locations with full details for non-admin user", async () => {
      // Create another location the instructor does NOT have access to
      const inaccessibleLoc = await prisma.location.create({
        data: {
          name: "Inaccessible Location",
          slug: "inaccessible-location",
          address: "456 Remote St",
        },
      });

      // Create instructor staff user and grant access only to testLocationId
      const instructorAuthId = "test-instructor";
      const instructorEmail = "instructor@test.com";
      await prisma.staffUser.create({
        data: {
          authId: instructorAuthId,
          email: instructorEmail,
          role: "instructor",
          fullName: "Test Instructor",
          active: true,
          accessibleLocations: {
            connect: { id: testLocationId },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get("/locations")
        .set("x-mock-auth-id", instructorAuthId)
        .set("x-mock-email", instructorEmail)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      
      const loc = response.body[0];
      expect(loc.id).toBe(testLocationId);
      expect(loc.name).toBe("Test Location");
      expect(loc.slug).toBe("test-location");
      expect(response.body.some((l: { id: string }) => l.id === inaccessibleLoc.id)).toBe(false);
    });
  });
});
