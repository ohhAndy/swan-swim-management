import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Get all payments with pagination and filters
  async findAll(
    page: number = 1,
    limit: number = 50,
    startDate?: string,
    endDate?: string,
    method?: string,
    query?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.paymentDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.paymentDate = {
        lte: new Date(endDate),
      };
    }

    if (method && method !== "all") {
      where.paymentMethod = method;
    }

    if (query) {
      where.invoice = {
        invoiceNumber: {
          contains: query,
          mode: "insensitive",
        },
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: {
          invoice: {
            include: {
              guardian: true,
            },
          },
          createdByUser: {
            select: { id: true, fullName: true },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Record a payment
  async create(createPaymentDto: CreatePaymentDto, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;
    // Check if invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice with ID ${createPaymentDto.invoiceId} not found`,
      );
    }

    // Check if invoice is voided
    if (invoice.status === "void") {
      throw new BadRequestException("Cannot add payment to a voided invoice");
    }

    // Calculate current amount paid
    const currentAmountPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Check if payment would exceed total
    const newTotal = currentAmountPaid + createPaymentDto.amount;
    if (newTotal > Number(invoice.totalAmount)) {
      throw new BadRequestException(
        `Payment of $${
          createPaymentDto.amount
        } would exceed invoice total. Balance remaining: $${
          Number(invoice.totalAmount) - currentAmountPaid
        }`,
      );
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: createPaymentDto.invoiceId,
        amount: createPaymentDto.amount,
        paymentDate: new Date(createPaymentDto.paymentDate),
        paymentMethod: createPaymentDto.paymentMethod,
        notes: createPaymentDto.notes,
        createdBy: staffUser.id,
      },
      include: {
        invoice: {
          include: {
            guardian: true,
            payments: true,
          },
        },
        createdByUser: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Update invoice status based on new payment total
    const totalPaid = currentAmountPaid + createPaymentDto.amount;
    const newStatus =
      totalPaid >= Number(invoice.totalAmount) ? "paid" : "partial";

    await this.prisma.invoice.update({
      where: { id: createPaymentDto.invoiceId },
      data: { status: newStatus },
    });

    return payment;
  }

  // Get all payments for an invoice
  async findByInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: "desc" },
      include: {
        createdByUser: {
          select: { id: true, fullName: true },
        },
      },
    });

    return payments;
  }

  // Get payment by ID
  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            guardian: true,
          },
        },
        createdByUser: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  // Delete payment (admin only, recalculates invoice status)
  async remove(id: string, user?: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { payments: true } } },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Delete payment
    await this.prisma.payment.delete({
      where: { id },
    });

    // Recalculate invoice status
    const remainingPayments = payment.invoice.payments.filter(
      (p) => p.id !== id,
    );
    const totalPaid = remainingPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    let newStatus: "paid" | "partial" | "void" = "partial";
    if (payment.invoice.status === "void") {
      newStatus = "void";
    } else if (totalPaid >= Number(payment.invoice.totalAmount)) {
      newStatus = "paid";
    } else if (totalPaid === 0) {
      newStatus = "partial"; // Or could be 'unpaid' if you add that status
    }

    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: newStatus },
    });

    // Log the deletion
    // Payment is deleted, but we can log that it happened.
    // We need user context for this.
    if (user) {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { authId: user.authId },
      });
      if (staffUser) {
        await this.auditLogsService.create({
          staffId: staffUser.id,
          action: "delete",
          entityType: "payment",
          entityId: id,
          metadata: {
            amount: payment.amount,
            invoiceId: payment.invoiceId,
          },
        });
      }
    }

    return { message: "Payment deleted successfully" };
  }
}
