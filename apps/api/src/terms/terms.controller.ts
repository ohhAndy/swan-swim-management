import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Body,
  Post,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { TermsService } from "./terms.service";
import { TermScheduleService } from "./term-schedule.service";
import { TermAvailabilityService } from "./term-availability.service";
import type { SlotPage, Term } from "@school/shared-types";
import { ZodValidationPipe } from "nestjs-zod";
import { CreateTermInput, CreateTermSchema } from "./dto/create-term.dto";
import {
  AvailabilityQueryDto,
  AvailabilityQuerySchema,
} from "./dto/availability-query.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import {
  CurrentLocationScope,
  fromParam,
  LocationScope,
  ScopedTo,
} from "../auth/location-scope";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("terms")
@ScopedTo(fromParam("term", "termId"))
export class TermsController {
  constructor(
    private readonly termsService: TermsService,
    private readonly termScheduleService: TermScheduleService,
    private readonly termAvailabilityService: TermAvailabilityService,
  ) {}

  @Post()
  @MinRole("admin")
  async create(
    @Body(new ZodValidationPipe(CreateTermSchema)) input: CreateTermInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return await this.termsService.createTermWithSchedule(
      input,
      staffUser,
      scope,
    );
  }

  @Get("all")
  async getAllTerms(
    @CurrentLocationScope() scope: LocationScope,
  ): Promise<Term[]> {
    return this.termsService.getAllTerms(scope);
  }

  @Get(":termId")
  async getTermTitle(@Param("termId") termId: string): Promise<string> {
    const title = await this.termsService.getTermTitle(termId);
    if (!title) {
      throw new NotFoundException(`Term with ID ${termId} not found`);
    }
    return title;
  }

  @Get(":termId/schedule/weekday/:weekday/slots")
  async getTimeSlotsForWeekday(
    @Param("termId") termId: string,
    @Param("weekday") weekday: string,
  ): Promise<string[]> {
    return this.termsService.getSlotsForWeekday(termId, Number(weekday));
  }

  @Get(":termId/schedule/weekday/:weekday/slots-detailed")
  async getDetailedTimeSlotsForWeekday(
    @Param("termId") termId: string,
    @Param("weekday") weekday: string,
  ) {
    return this.termsService.getDetailedSlotsForWeekday(
      termId,
      Number(weekday),
    );
  }

  @Get(":termId/schedule/weekday/:weekday/slots-default")
  async getDefaultTimeSlots(
    @Param("termId") termId: string,
  ): Promise<(string | null)[]> {
    return this.termsService.getDefaultSlots(termId);
  }

  @Get(":termId/schedule/weekday/:weekday/slot/:start/:end")
  async getSlotPage(
    @Param("termId") termId: string,
    @Param("weekday", ParseIntPipe) weekday: number,
    @Param("start") start: string,
    @Param("end") end: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @Query("month") month?: string,
  ): Promise<SlotPage> {
    return this.termScheduleService.slotByWeekdayAndTime(
      weekday,
      termId,
      start,
      end,
      { month, role: staffUser?.role },
    );
  }

  @Get("schedule/date/:date")
  async getDailySchedule(
    @Param("date") date: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.termScheduleService.getDailySchedule(
      scope,
      date,
      staffUser?.role,
    );
  }

  @Get(":termId/availability")
  async getTermAvailability(
    @Param("termId") termId: string,
    @Query(new ZodValidationPipe(AvailabilityQuerySchema))
    q: AvailabilityQueryDto,
  ) {
    return this.termAvailabilityService.getTermAvailability(
      termId,
      q.level,
      q.weekday,
    );
  }

  @Get(":termId/flexible-schedule")
  async getFlexibleSchedule(@Param("termId") termId: string) {
    return this.termScheduleService.getFlexibleSlotPage(termId);
  }
}
