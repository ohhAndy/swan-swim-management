import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { ZodValidationPipe } from "nestjs-zod";
import {
  PracticeCheckInInput,
  PracticeCheckInSchema,
  UpdateMakeupAttendanceInput,
  UpdateMakeupAttendanceSchema,
  UpsertAttendanceInput,
  UpsertAttendanceSchema,
} from "./dto/attendance.dto";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("attendance")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Put()
  @Roles("super_admin", "admin", "manager", "supervisor")
  async upsert(
    @Body(new ZodValidationPipe(UpsertAttendanceSchema))
    body: UpsertAttendanceInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.attendanceService.upsert(body, staffUser);
  }

  @Patch("makeup")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateMakeUp(
    @Body(new ZodValidationPipe(UpdateMakeupAttendanceSchema))
    body: UpdateMakeupAttendanceInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.attendanceService.updateMakeup(body, staffUser);
  }

  @Get("practice-roster/:sessionId")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async getPracticeRoster(
    @Param("sessionId") sessionId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.attendanceService.getPracticeRoster(sessionId, staffUser);
  }

  @Post("practice-checkin")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async practiceCheckIn(
    @Body(new ZodValidationPipe(PracticeCheckInSchema))
    body: PracticeCheckInInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.attendanceService.practiceCheckIn(body, staffUser);
  }
}
