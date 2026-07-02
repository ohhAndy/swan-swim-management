import { Body, Controller, Put, Patch, UseGuards } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { ZodValidationPipe } from "nestjs-zod";
import {
  UpdateMakeupAttendanceInput,
  UpdateMakeupAttendanceSchema,
  UpsertAttendanceInput,
  UpsertAttendanceSchema,
} from "./dto/attendance.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth.types";

@Controller("attendance")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Put()
  @Roles("super_admin", "admin", "manager", "supervisor")
  async upsert(
    @Body(new ZodValidationPipe(UpsertAttendanceSchema))
    body: UpsertAttendanceInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.upsert(body, user);
  }

  @Patch("makeup")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateMakeUp(
    @Body(new ZodValidationPipe(UpdateMakeupAttendanceSchema))
    body: UpdateMakeupAttendanceInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.updateMakeup(body, user);
  }
}
