import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedLocation } from "./utils/seeds";

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
      const location = await seedLocation(prisma);
      const response = await request(app.getHttpServer())
        .post("/invoices")
        .set("x-location-id", location.id)
        .send({
          guardianId: testGuardianId,
          totalAmount: 100,
          notes: "test",
          lineItems: []
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
      expect(response.body.location.id).toBe(location.id);
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

  describe("date filters", () => {
    it("filters by the Toronto calendar day, including evenings", async () => {
      // 9:30 pm Toronto on Nov 24 is already Nov 25 in UTC
      await prisma.invoice.update({
        where: { id: testInvoiceId },
        data: { createdAt: new Date("2026-11-25T02:30:00Z") },
      });
      const ids = async (query: Record<string, string>) =>
        (
          await request(app.getHttpServer())
            .get("/invoices")
            .query(query)
            .expect(200)
        ).body.data.map((i: { id: string }) => i.id);

      expect(await ids({ startDate: "2026-11-24", endDate: "2026-11-24" })).toContain(testInvoiceId);
      expect(await ids({ startDate: "2026-11-25" })).not.toContain(testInvoiceId);
    });

    it("rejects a date that is not YYYY-MM-DD", () => {
      return request(app.getHttpServer())
        .get("/invoices")
        .query({ startDate: "yesterday" })
        .expect(400);
    });
  });
});
