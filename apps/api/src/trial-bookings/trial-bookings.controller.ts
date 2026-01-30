// apps/api/src/trial-bookings/trial-bookings.controller.ts
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Get,
} from "@nestjs/common";
import { TrialBookingsService } from "./trial-bookings.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { TrialStatus } from "@prisma/client";

@Controller("trial-bookings")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TrialBookingsController {
  constructor(private readonly service: TrialBookingsService) {}

  @Get("upcoming")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async getUpcoming() {
    return this.service.findUpcoming();
  }

  @Get("past")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async getPast() {
    return this.service.findPast();
  }

  @Get("stats")
  @Roles("super_admin", "admin", "manager")
  async getStats() {
    return this.service.getStats();
  }

  @Post()
  @Roles("super_admin", "admin", "manager")
  async createTrialBooking(
    @Body()
    body: {
      classSessionId: string;
      childName: string;
      childAge: number;
      parentPhone: string;
      notes?: string;
      classRatio?: string;
    },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.createTrialBooking(
      body.classSessionId,
      body.childName,
      body.childAge,
      body.parentPhone,
      body.notes || null,
      body.classRatio || "3:1",
      staffUser,
    );
  }

  @Patch(":id/status")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: TrialStatus },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.updateTrialStatus(id, body.status, staffUser);
  }

  @Patch(":id/convert")
  @Roles("super_admin", "admin", "manager")
  async convertToStudent(
    @Param("id") id: string,
    @Body() body: { studentId: string },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.convertToStudent(id, body.studentId, staffUser);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async deleteTrialBooking(
    @Param("id") id: string,
    @CurrentUser() staffUser: any,
  ) {
    return this.service.deleteTrialBooking(id, staffUser);
  }
}
