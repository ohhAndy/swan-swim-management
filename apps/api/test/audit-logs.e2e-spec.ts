import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedSuperAdmin } from "./utils/seeds";

describe("AuditLogsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    const admin = await seedSuperAdmin(prisma);
    await prisma.auditLog.create({
      data: {
        staffId: admin.id,
        action: "TEST_ACTION",
        entityType: "TestEntity",
        entityId: "123",
        metadata: { key: "value" }
      }
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /audit-logs", () => {
    it("should return a list of audit logs", async () => {
      // In the mock auth guard, we can set the role to super_admin or we just use super_admin in test-setup
      const response = await request(app.getHttpServer())
        .get("/audit-logs")
        .set("x-mock-auth-id", "test-superadmin")
        .expect(200);
      
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeDefined();
    });
  });
});
