import { Controller, Get, Query, Res } from "@nestjs/common";
import { ExportsService } from "./exports.service";
import { Response } from "express";
import { ZodValidationPipe } from "nestjs-zod";
import { MinRole } from "../auth/roles.decorator";
import {
  InvoiceExportQueryDto,
  InvoiceExportQuerySchema,
} from "./dto/export-query.dto";
import {
  PaymentFilterDto,
  PaymentFilterSchema,
} from "../payments/dto/payment-query.dto";
import { CurrentLocationScope, LocationScope } from "../auth/location-scope";

@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get("payments")
  @MinRole("manager")
  async exportPayments(
    @Query(new ZodValidationPipe(PaymentFilterSchema))
    q: PaymentFilterDto,
    @Res() res: Response,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    const workbook = await this.exportsService.generatePaymentsSheet(
      q.startDate,
      q.endDate,
      q.method,
      q.query,
      scope,
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
  @MinRole("manager")
  async exportInvoices(
    @Query(new ZodValidationPipe(InvoiceExportQuerySchema))
    q: InvoiceExportQueryDto,
    @Res() res: Response,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    const workbook = await this.exportsService.generateInvoicesSheet(
      q.startDate,
      q.endDate,
      q.status,
      q.query,
      scope,
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
