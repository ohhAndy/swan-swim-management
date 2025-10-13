import { Controller, Get, Query } from "@nestjs/common";
import { SessionsService } from "./sessions.service";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get("slot")
  async seatsForSlot(
    @Query("termId") termId: string,
    @Query("weekday") weekday: string,
    @Query("startTime") startTime: string,
    @Query("date") dateOnly: string
  ) {
    return this.sessionsService.seatsForSlot({
      termId,
      weekday: Number(weekday),
      startTime,
      dateOnly,
    });
  }
}
