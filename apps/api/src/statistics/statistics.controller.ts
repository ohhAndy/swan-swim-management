import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { StatisticsService } from "./statistics.service";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("statistics")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  @Roles("super_admin", "admin", "manager")
  async getDashboardStats(
    @Query("termId") termId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.statisticsService.getDashboardStats(termId, staffUser, locationId);
  }
}
