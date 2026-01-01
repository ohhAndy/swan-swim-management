import { Controller, Get, Query } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("dashboard")
  async getDashboardStats(@Query("termId") termId: string) {
    return this.statisticsService.getDashboardStats(termId);
  }
}
