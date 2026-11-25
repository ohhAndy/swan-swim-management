import { Controller, Get, Param, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { ZodValidationPipe } from "nestjs-zod";
import { Roles } from "../auth/roles.decorator";
import { DateRangeQueryDto, DateRangeQuerySchema } from "./dto/financial-query.dto";

@Controller("analytics")
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
    @Query(new ZodValidationPipe(DateRangeQuerySchema)) q: DateRangeQueryDto,
  ) {
    return this.analyticsService.getTermFinancialDetails(
      id,
      q.startDate,
      q.endDate,
    );
  }
}
