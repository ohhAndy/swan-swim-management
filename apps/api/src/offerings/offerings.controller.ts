import { Controller, Get, Query, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { ZodValidationPipe } from "nestjs-zod";
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentStaffUser } from '../auth/current-user.decorator';

@Controller("offerings")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @Get("available-for-transfer")
  async getAvailableForTransfer(
    @Query("termId") termId: string,
    @Query("excludeOfferingId") excludeOfferingId: string,
    @Query("level") level?: string
  ) {
    return this.offeringsService.getOfferingsForTransfer(termId, excludeOfferingId, level);
  }

  @Patch(":offeringId")
  @Roles('admin', 'manager', 'supervisor')
  async updateOfferingInfo(
    @Param("offeringId") offeringId: string,
    @Body() body: { title: string },
    @CurrentUser() user: any, 
  ) {
    return this.offeringsService.updateOfferingInfo(offeringId, body, user);
  }
}
