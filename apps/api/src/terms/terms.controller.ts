import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Body,
  Post,
  UseGuards,
  Query,
} from "@nestjs/common";
import { TermsService } from "./terms.service";
import type { SlotPage, Term } from "@school/shared-types";
import { CreateTermSchema } from "./dto/create-term.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentStaffUser } from "../auth/current-user.decorator";

@Controller("terms")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  @Roles("admin")
  async create(@Body() body: unknown, @CurrentUser() user: any) {
    const input = CreateTermSchema.parse(body);
    return await this.termsService.createTermWithSchedule(input, user);
  }

  @Get("all")
  async getAllTerms(): Promise<Term[]> {
    return this.termsService.getAllTerms();
  }

  @Get(":termId")
  async getTermTitle(@Param("termId") termId: string): Promise<string | null> {
    return this.termsService.getTermTitle(termId);
  }

  @Get(":termId/schedule/weekday/:weekday/slots")
  async getTimeSlotsForWeekday(
    @Param("termId") termId: string,
    @Param("weekday") weekday: string
  ): Promise<string[]> {
    return this.termsService.getSlotsForWeekday(termId, Number(weekday));
  }

  @Get(":termId/schedule/weekday/:weekday/slots-default")
  async getDefaultTimeSlots(
    @Param("termId") termId: string
  ): Promise<(string | null)[]> {
    return this.termsService.getDefaultSlots(termId);
  }

  @Get(":termId/schedule/weekday/:weekday/slot/:start/:end")
  async getSlotPage(
    @Param("termId") termId: string,
    @Param("weekday", ParseIntPipe) weekday: number,
    @Param("start") start: string,
    @Param("end") end: string
  ): Promise<SlotPage> {
    return this.termsService.slotByWeekdayAndTime(weekday, termId, start, end);
  }

  @Get(":termId/schedule/date/:date")
  async getDailySchedule(
    @Param("termId") termId: string,
    @Param("date") date: string
  ) {
    return this.termsService.getDailySchedule(termId, date);
  }

  @Get(":termId/availability")
  async getTermAvailability(
    @Param("termId") termId: string,
    @Query("level") level?: string
  ) {
    return this.termsService.getTermAvailability(termId, level);
  }
}
