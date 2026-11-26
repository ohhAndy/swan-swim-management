import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as ExcelJS from "exceljs";
import { Prisma, PaymentMethod, InvoiceStatus } from "@prisma/client";
import { calendarDateRange, torontoDayRange } from "../common/date.utils";
import { accessibleFilter, LocationScope } from "../auth/location-scope";

const MAX_EXPORT_LIMIT = 10000;

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async generatePaymentsSheet(
    startDate?: string,
    endDate?: string,
    method?: string,
    query?: string,
    scope?: LocationScope,
  ) {
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      locationId: scope ? accessibleFilter(scope) : undefined,
    };
    const where: Prisma.PaymentWhereInput = { invoice: invoiceWhere };

    const paymentDate = calendarDateRange(startDate, endDate);
    if (paymentDate) where.paymentDate = paymentDate;

    if (method && method !== "all") {
      where.paymentMethod = method as PaymentMethod;
    }

    if (query) {
      invoiceWhere.invoiceNumber = {
        contains: query,
        mode: "insensitive",
      };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      take: MAX_EXPORT_LIMIT,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          include: {
            guardian: true,
            location: true,
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
      { header: "Location", key: "location", width: 20 },
      { header: "Invoice #", key: "invoiceNumber", width: 15 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    payments.forEach((p) => {
      sheet.addRow({
        date: p.paymentDate,
        amount: Number(p.amount),
        method: p.paymentMethod,
        guardian: p.invoice.guardian?.fullName || "No Guardian",
        location: p.invoice.location?.name || "-",
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
    query?: string,
    scope?: LocationScope,
  ) {
    const where: Prisma.InvoiceWhereInput = {
      locationId: scope ? accessibleFilter(scope) : undefined,
    };

    const createdAt = torontoDayRange(startDate, endDate);
    if (createdAt) where.createdAt = createdAt;

    if (status && status !== "all") {
      where.status = status as InvoiceStatus;
    }

    if (query) {
      where.OR = [
        { invoiceNumber: { contains: query, mode: "insensitive" } },
        { guardian: { fullName: { contains: query, mode: "insensitive" } } },
      ];
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      take: MAX_EXPORT_LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        guardian: true,
        location: true,
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
      { header: "Location", key: "location", width: 20 },
      { header: "Total Amount", key: "total", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    invoices.forEach((inv) => {
      sheet.addRow({
        date: inv.createdAt,
        invoiceNumber: inv.invoiceNumber || "Draft",
        guardian: inv.guardian?.fullName || "No Guardian",
        location: inv.location?.name || "-",
        total: Number(inv.totalAmount),
        status: inv.status,
        notes: inv.notes,
      });
    });

    return workbook;
  }
}
