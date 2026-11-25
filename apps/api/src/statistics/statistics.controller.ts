import { Controller, Get, Query } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { Roles } from "../auth/roles.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { StatisticsService } from "./statistics.service";
import { RequestStaffUser } from "../auth/auth.types";
import {
  DashboardStatsQueryDto,
  DashboardStatsQuerySchema,
} from "./dto/dashboard-stats-query.dto";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  @Roles("super_admin", "admin", "manager")
  async getDashboardStats(
    @Query(new ZodValidationPipe(DashboardStatsQuerySchema))
    { termId }: DashboardStatsQueryDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.statisticsService.getDashboardStats(termId, staffUser, locationId);
  }
}
