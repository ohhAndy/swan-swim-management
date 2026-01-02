import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as ExcelJS from "exceljs";

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async generatePaymentsSheet(
    startDate?: string,
    endDate?: string,
    method?: string,
    query?: string
  ) {
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

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          include: {
            guardian: true,
          },
        },
        createdByUser: {
          select: { fullName: true },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Amount", key: "amount", width: 10 },
      { header: "Method", key: "method", width: 15 },
      { header: "Guardian", key: "guardian", width: 25 },
      { header: "Invoice #", key: "invoiceNumber", width: 15 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    payments.forEach((p) => {
      sheet.addRow({
        date: p.paymentDate,
        amount: Number(p.amount),
        method: p.paymentMethod,
        guardian: p.invoice.guardian.fullName,
        invoiceNumber: p.invoice.invoiceNumber || "N/A",
        notes: p.notes,
      });
    });

    return workbook;
  }

  async generateInvoicesSheet(
    startDate?: string,
    endDate?: string,
    status?: string,
    query?: string
  ) {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { invoiceNumber: { contains: query, mode: "insensitive" } },
        { guardian: { fullName: { contains: query, mode: "insensitive" } } },
      ];
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        guardian: true,
        createdByUser: {
          select: { fullName: true },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Invoices");

    sheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Invoice #", key: "invoiceNumber", width: 15 },
      { header: "Guardian", key: "guardian", width: 25 },
      { header: "Total Amount", key: "total", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    invoices.forEach((inv) => {
      sheet.addRow({
        date: inv.createdAt,
        invoiceNumber: inv.invoiceNumber || "Draft",
        guardian: inv.guardian.fullName,
        total: Number(inv.totalAmount),
        status: inv.status,
        notes: inv.notes,
      });
    });

    return workbook;
  }
}
