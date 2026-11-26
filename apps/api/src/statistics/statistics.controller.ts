import { Controller, Get, Query } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { MinRole } from "../auth/roles.decorator";
import {
  CurrentLocationScope,
  fromQuery,
  LocationScope,
  ScopedTo,
} from "../auth/location-scope";
import { StatisticsService } from "./statistics.service";
import {
  DashboardStatsQueryDto,
  DashboardStatsQuerySchema,
} from "./dto/dashboard-stats-query.dto";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  @MinRole("manager")
  @ScopedTo(fromQuery("term", "termId"))
  async getDashboardStats(
    @Query(new ZodValidationPipe(DashboardStatsQuerySchema))
    { termId }: DashboardStatsQueryDto,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.statisticsService.getDashboardStats(termId, scope);
  }
}
