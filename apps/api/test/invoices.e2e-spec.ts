import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

describe("InvoicesController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testGuardianId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const guardian = await seedGuardian(prisma);
    testGuardianId = guardian.id;

    const invoice = await prisma.invoice.create({
      data: {
        guardianId: testGuardianId,
        totalAmount: 100,
        status: "partial",
        invoiceNumber: "INV-001"
      }
    });
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /invoices", () => {
    it("should return a list of invoices", async () => {
      const response = await request(app.getHttpServer())
        .get("/invoices")
        .expect(200);
      
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /invoices/:id", () => {
    it("should return an invoice by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/invoices/${testInvoiceId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testInvoiceId);
    });
  });

  describe("POST /invoices", () => {
    it("should create an invoice", async () => {
      const response = await request(app.getHttpServer())
        .post("/invoices")
        .send({
          guardianId: testGuardianId,
          totalAmount: 100,
          notes: "test",
          lineItems: []
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });
  });

  describe("PATCH /invoices/:id", () => {
    it("should update an invoice", async () => {
      await request(app.getHttpServer())
        .patch(`/invoices/${testInvoiceId}`)
        .send({ notes: "updated notes" })
        .expect(200);
      
      const dbInvoice = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      expect(dbInvoice?.notes).toBe("updated notes");
    });
  });

  describe("DELETE /invoices/:id", () => {
    it("should delete an invoice", async () => {
      await request(app.getHttpServer())
        .delete(`/invoices/${testInvoiceId}`)
        .expect(200);
      
      const dbInvoice = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      expect(dbInvoice).toBeNull();
    });
  });
});
