import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ExportsService } from "./exports.service";
import { Response } from "express";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("exports")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get("payments")
  @Roles("super_admin", "admin", "manager")
  async exportPayments(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("method") method: string,
    @Query("query") query: string,
    @Res() res: Response,
  ) {
    const workbook = await this.exportsService.generatePaymentsSheet(
      startDate,
      endDate,
      method,
      query,
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
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("status") status: string,
    @Query("query") query: string,
    @Res() res: Response,
  ) {
    const workbook = await this.exportsService.generateInvoicesSheet(
      startDate,
      endDate,
      status,
      query,
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
