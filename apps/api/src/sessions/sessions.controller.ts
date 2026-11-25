import { Controller, Get, Query } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SessionsService } from "./sessions.service";
import { SlotQueryDto, SlotQuerySchema } from "./dto/slot-query.dto";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get("slot")
  async seatsForSlot(
    @Query(new ZodValidationPipe(SlotQuerySchema)) q: SlotQueryDto,
  ) {
    return this.sessionsService.seatsForSlot({
      termId: q.termId,
      weekday: q.weekday,
      startTime: q.startTime,
      dateOnly: q.date,
    });
  }
}
