import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  async getDashboardStats(
    @Query("termId") termId: string,
    @CurrentUser() user: any,
    @CurrentLocationId() locationId?: string
  ) {
    return this.statisticsService.getDashboardStats(termId, user, locationId);
  }
}
