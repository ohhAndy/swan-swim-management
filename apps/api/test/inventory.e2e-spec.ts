import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin } from "./utils/seeds";

describe("InventoryController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testItemId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);

    const item = await prisma.inventoryItem.create({
      data: {
        name: "Swim Cap",
        sku: "CAP-001",
        price: 15.0,
        stock: 50,
      }
    });
    testItemId = item.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /inventory", () => {
    it("should return a list of inventory items", async () => {
      const response = await request(app.getHttpServer())
        .get("/inventory")
        .expect(200);
      
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /inventory/:id", () => {
    it("should return an item by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/${testItemId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testItemId);
    });
  });

  describe("POST /inventory", () => {
    it("should create an inventory item", async () => {
      const response = await request(app.getHttpServer())
        .post("/inventory")
        .send({
          name: "Goggles",
          sku: "GOG-001",
          price: 25.0,
          stock: 30,
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });
  });

  describe("PATCH /inventory/:id", () => {
    it("should update an inventory item", async () => {
      await request(app.getHttpServer())
        .patch(`/inventory/${testItemId}`)
        .send({ stock: 45 })
        .expect(200);
      
      const dbItem = await prisma.inventoryItem.findUnique({ where: { id: testItemId } });
      expect(dbItem?.stock).toBe(45);
    });
  });

  describe("DELETE /inventory/:id", () => {
    it("should delete an inventory item", async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${testItemId}`)
        .expect(200);
      
      const dbItem = await prisma.inventoryItem.findUnique({ where: { id: testItemId } });
      expect(dbItem?.active).toBe(false);
    });
  });
});
