import { Controller, Get, Query, Res } from "@nestjs/common";
import { ExportsService } from "./exports.service";
import { Response } from "express";
import { ZodValidationPipe } from "nestjs-zod";
import { Roles } from "../auth/roles.decorator";
import {
  InvoiceExportQueryDto,
  InvoiceExportQuerySchema,
} from "./dto/export-query.dto";
import {
  PaymentFilterDto,
  PaymentFilterSchema,
} from "../payments/dto/payment-query.dto";

@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get("payments")
  @Roles("super_admin", "admin", "manager")
  async exportPayments(
    @Query(new ZodValidationPipe(PaymentFilterSchema))
    q: PaymentFilterDto,
    @Res() res: Response,
  ) {
    const workbook = await this.exportsService.generatePaymentsSheet(
      q.startDate,
      q.endDate,
      q.method,
      q.query,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "payments.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get("invoices")
  @Roles("super_admin", "admin", "manager")
  async exportInvoices(
    @Query(new ZodValidationPipe(InvoiceExportQuerySchema))
    q: InvoiceExportQueryDto,
    @Res() res: Response,
  ) {
    const workbook = await this.exportsService.generateInvoicesSheet(
      q.startDate,
      q.endDate,
      q.status,
      q.query,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "invoices.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
