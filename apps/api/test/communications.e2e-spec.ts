import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

describe("CommunicationsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    await seedGuardian(prisma);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /communications/recipients", () => {
    it("should return a list of recipients", async () => {
      const response = await request(app.getHttpServer())
        .post("/communications/recipients")
        .send({})
        .expect(201);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /communications/send", () => {
    it("should send an email", async () => {
      const response = await request(app.getHttpServer())
        .post("/communications/send")
        .send({
          subject: "Test Email",
          body: "Hello World",
          recipients: ["test@example.com"]
        })
        .expect(201);
      
      expect(response.body.success).toBeDefined();
    });
  });
});
