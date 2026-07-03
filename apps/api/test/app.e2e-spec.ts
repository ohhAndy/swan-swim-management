import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClientExceptionFilter } from "../src/common/filters/prisma-client-exception.filter";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
    app.useGlobalPipes(new ZodValidationPipe());
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Global Route Handling", () => {
    it("should return 404 for an unknown route", () => {
      return request(app.getHttpServer())
        .get("/api/unknown-route-that-does-not-exist")
        .expect(404);
    });
  });

  // Note: Testing actual controllers requires valid Auth tokens because of Clerk/AuthGuard.
  // We can test this by mocking the AuthGuard itself to simulate an authenticated user,
  // or by providing a valid mock payload if the guard parses headers.
  
  // For now, let's just make sure the app boots up and handles basic routing.
});
