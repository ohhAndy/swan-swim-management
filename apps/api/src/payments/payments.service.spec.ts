import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";
import { PaymentMethod } from "@prisma/client";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const mockUser: AuthenticatedUser = { authId: "user1", email: "test@test.com" };

    it("should throw NotFoundException if invoice does not exist", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ invoiceId: "inv1", amount: 100, paymentDate: "2024-01-01", paymentMethod: PaymentMethod.visa, notes: "" }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if invoice is voided", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      prismaMock.invoice.findUnique.mockResolvedValue({
        id: "inv1",
        status: "void",
        payments: [],
      });

      await expect(
        service.create({ invoiceId: "inv1", amount: 100, paymentDate: "2024-01-01", paymentMethod: PaymentMethod.visa, notes: "" }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it("should successfully create payment and update invoice status to paid", async () => {
      prismaMock.staffUser.findUnique.mockResolvedValue({ id: "staff1" });
      
      const mockInvoice = {
        id: "inv1",
        status: "partial",
        totalAmount: 200,
        payments: [{ amount: 100 }], // 100 already paid
      };
      
      prismaMock.invoice.findUnique.mockResolvedValue(mockInvoice);
      prismaMock.payment.create.mockResolvedValue({ id: "pay1", amount: 100 });
      prismaMock.invoice.update.mockResolvedValue({ ...mockInvoice, status: "paid" });

      const result = await service.create(
        { invoiceId: "inv1", amount: 100, paymentDate: "2024-01-01", paymentMethod: PaymentMethod.visa, notes: "Final payment" },
        mockUser
      );

      expect(result).toBeDefined();
      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: "inv1",
            amount: 100,
            paymentMethod: PaymentMethod.visa
          }),
        }),
      );
      // Status should be paid because 100 (existing) + 100 (new) >= 200 total
      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: "inv1" },
        data: { status: "paid" },
      });
    });
  });

  describe("remove", () => {
    it("should recalculate invoice status when a payment is deleted", async () => {
      const mockPayment = {
        id: "pay1",
        amount: 50,
        invoiceId: "inv1",
        invoice: {
          id: "inv1",
          status: "paid",
          totalAmount: 100,
          payments: [
            { id: "pay1", amount: 50 },
            { id: "pay2", amount: 50 } // Total paid 100. If we remove pay1, total becomes 50 -> partial
          ]
        }
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment);
      prismaMock.payment.delete.mockResolvedValue(mockPayment);

      await service.remove("pay1");

      expect(prismaMock.payment.delete).toHaveBeenCalledWith({ where: { id: "pay1" } });
      
      // Invoice should drop to 'partial'
      expect(prismaMock.invoice.update).toHaveBeenCalledWith({
        where: { id: "inv1" },
        data: { status: "partial" },
      });
    });
  });
});
