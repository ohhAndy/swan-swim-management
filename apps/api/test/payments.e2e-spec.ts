import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

describe("PaymentsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testInvoiceId: string;
  let testPaymentId: string;
  let testGuardianId: string;

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
        invoiceNumber: "INV-PAY"
      }
    });
    testInvoiceId = invoice.id;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: testInvoiceId,
        amount: 50,
        paymentDate: new Date(),
        paymentMethod: "cash",
        notes: "initial payment"
      }
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("GET /payments", () => {
    it("should return a list of payments", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .expect(200);
      
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /payments/:id", () => {
    it("should return a payment by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${testPaymentId}`)
        .expect(200);
      
      expect(response.body.id).toBe(testPaymentId);
    });
  });

  describe("GET /payments/invoice/:invoiceId", () => {
    it("should return payments by invoice id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/invoice/${testInvoiceId}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /payments", () => {
    it("should record a payment", async () => {
      const response = await request(app.getHttpServer())
        .post("/payments")
        .send({
          invoiceId: testInvoiceId,
          amount: 50,
          paymentDate: new Date().toISOString(),
          paymentMethod: "visa",
          notes: "test payment"
        })
        .expect(201);
      
      expect(response.body.id).toBeDefined();
    });
  });

  describe("PATCH /payments/:id", () => {
    it("should update a payment", async () => {
      await request(app.getHttpServer())
        .patch(`/payments/${testPaymentId}`)
        .send({ notes: "updated notes" })
        .expect(200);
      
      const dbPayment = await prisma.payment.findUnique({ where: { id: testPaymentId } });
      expect(dbPayment?.notes).toBe("updated notes");
    });
  });

  describe("DELETE /payments/:id", () => {
    it("should delete a payment", async () => {
      await request(app.getHttpServer())
        .delete(`/payments/${testPaymentId}`)
        .expect(200);
      
      const dbPayment = await prisma.payment.findUnique({ where: { id: testPaymentId } });
      expect(dbPayment).toBeNull();
    });
  });
});
