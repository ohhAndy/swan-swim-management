import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { StatisticsService } from "./statistics.service";
import { AuthenticatedUser } from "../auth/auth.types";

@Controller("statistics")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  @Roles("super_admin", "admin", "manager")
  async getDashboardStats(
    @Query("termId") termId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.statisticsService.getDashboardStats(termId, user, locationId);
  }
}
