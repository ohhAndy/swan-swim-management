import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedTerm, seedClassOffering } from "./utils/seeds";

describe("OfferingsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTermId: string;
  let testOfferingId: string;
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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /offerings/available-for-transfer", () => {
    it("should return offerings available for transfer", async () => {
      const response = await request(app.getHttpServer())
        .get("/offerings/available-for-transfer")
        .query({ termId: testTermId, excludeOfferingId: "non-existent-id" })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /offerings", () => {
    it("should create a new offering", async () => {
      const response = await request(app.getHttpServer())
        .post("/offerings")
        .send({
          termId: testTermId,
          type: "regular",
          weekday: 2,
          startTime: "10:00",
          title: "New Offering",
          capacity: 8,
        })
        .expect(201);
      
      expect(response.body.title).toBe("New Offering");
    });
  });

  describe("PATCH /offerings/:offeringId", () => {
    it("should update an offering title", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/offerings/${testOfferingId}`)
        .send({
          title: "Updated Title",
        })
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("DELETE /offerings/:offeringId", () => {
    it("should delete an offering", async () => {
      await request(app.getHttpServer())
        .delete(`/offerings/${testOfferingId}`)
        .expect(200);
      
      const dbOffering = await prisma.classOffering.findUnique({ where: { id: testOfferingId } });
      expect(dbOffering).toBeNull();
    });
  });
});
