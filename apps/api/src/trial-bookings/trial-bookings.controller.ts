// apps/api/src/trial-bookings/trial-bookings.controller.ts
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrialBookingsService } from './trial-bookings.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { TrialStatus } from '@prisma/client';

@Controller('trial-bookings')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TrialBookingsController {
  constructor(private readonly service: TrialBookingsService) {}

  @Post()
  @Roles('admin', 'manager')
  async createTrialBooking(
    @Body()
    body: {
      classSessionId: string;
      childName: string;
      childAge: number;
      parentPhone: string;
      notes?: string;
    },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.createTrialBooking(
      body.classSessionId,
      body.childName,
      body.childAge,
      body.parentPhone,
      body.notes || null,
      staffUser,
    );
  }

  @Patch(':id/status')
  @Roles('admin', 'manager', 'supervisor')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TrialStatus },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.updateTrialStatus(id, body.status, staffUser);
  }

  @Patch(':id/convert')
  @Roles('admin', 'manager')
  async convertToStudent(
    @Param('id') id: string,
    @Body() body: { studentId: string },
    @CurrentUser() staffUser: any,
  ) {
    return this.service.convertToStudent(id, body.studentId, staffUser);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  async deleteTrialBooking(
    @Param('id') id: string,
    @CurrentUser() staffUser: any,
  ) {
    return this.service.deleteTrialBooking(id, staffUser);
  }
}