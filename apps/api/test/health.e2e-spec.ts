import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp } from "./utils/test-setup";

describe("HealthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /health", () => {
    it("should return ok status", async () => {
      const response = await request(app.getHttpServer())
        .get("/health")
        .expect(200);
      
      expect(response.body).toEqual({ status: "ok" });
    });
  });
});
