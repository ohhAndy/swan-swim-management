import { Controller, Get, UseGuards, Param, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("analytics")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("financial/location")
  @Roles("super_admin", "admin")
  async getRevenueByLocation() {
    return this.analyticsService.getRevenueByLocation();
  }

  @Get("financial/term")
  @Roles("super_admin", "admin")
  async getRevenueByTerm() {
    return this.analyticsService.getRevenueByTerm();
  }
  @Get("financial/term/:id")
  @Roles("super_admin", "admin")
  async getTermFinancialDetails(
    @Param("id") id: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.analyticsService.getTermFinancialDetails(
      id,
      startDate,
      endDate,
    );
  }
}
