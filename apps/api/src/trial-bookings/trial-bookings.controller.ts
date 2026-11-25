import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Get,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { TrialBookingsService } from "./trial-bookings.service";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import {
  ConvertTrialDto,
  ConvertTrialSchema,
  CreateTrialBookingDto,
  CreateTrialBookingSchema,
  UpdateTrialNotesDto,
  UpdateTrialNotesSchema,
  UpdateTrialStatusDto,
  UpdateTrialStatusSchema,
} from "./dto/trial-booking.dto";

@Controller("trial-bookings")
export class TrialBookingsController {
  constructor(private readonly service: TrialBookingsService) {}

  @Get("upcoming")
  @MinRole("supervisor")
  async getUpcoming() {
    return this.service.findUpcoming();
  }

  @Get("past")
  @MinRole("supervisor")
  async getPast() {
    return this.service.findPast();
  }

  @Get("stats")
  @MinRole("manager")
  async getStats() {
    return this.service.getStats();
  }

  @Post()
  @MinRole("manager")
  async createTrialBooking(
    @Body(new ZodValidationPipe(CreateTrialBookingSchema))
    body: CreateTrialBookingDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.createTrialBooking(
      body.classSessionId,
      body.childName,
      body.childAge,
      body.parentPhone,
      body.notes || null,
      body.classRatio,
      staffUser,
    );
  }

  @Patch(":id/status")
  @MinRole("supervisor")
  async updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateTrialStatusSchema))
    body: UpdateTrialStatusDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.updateTrialStatus(id, body.status, staffUser);
  }

  @Patch(":id/notes")
  @MinRole("supervisor")
  async updateNotes(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateTrialNotesSchema))
    body: UpdateTrialNotesDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.updateTrialNotes(id, body.notes, staffUser);
  }

  @Patch(":id/convert")
  @MinRole("manager")
  async convertToStudent(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ConvertTrialSchema)) body: ConvertTrialDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.convertToStudent(id, body.studentId, staffUser);
  }

  @Delete(":id")
  @MinRole("manager")
  async deleteTrialBooking(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.deleteTrialBooking(id, staffUser);
  }
}
