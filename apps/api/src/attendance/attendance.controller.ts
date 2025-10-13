import { Body, Controller, Put, Patch, UseGuards } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { ZodValidationPipe } from "nestjs-zod";
import { UpdateMakeupAttendanceInput, UpdateMakeupAttendanceSchema, UpsertAttendanceInput, UpsertAttendanceSchema } from "./dto/attendance.dto";
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentStaffUser } from '../auth/current-user.decorator';
@Controller("attendance")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @Put()
    @Roles('admin', 'manager', 'supervisor')
    async upsert(
        @Body(new ZodValidationPipe(UpsertAttendanceSchema)) body: UpsertAttendanceInput,
        @CurrentUser() user: any,
    ) {
        return this.attendanceService.upsert(body, user);
    }

    @Patch("makeup")
    @Roles('admin', 'manager', 'supervisor')
    async updateMakeUp(
        @Body(new ZodValidationPipe(UpdateMakeupAttendanceSchema)) body: UpdateMakeupAttendanceInput,
        @CurrentUser() user: any,
    ) {
        return this.attendanceService.updateMakeup(body, user);
    }

}