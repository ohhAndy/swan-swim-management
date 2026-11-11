import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  UseGuards,
  Post,
  Delete,
} from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { ZodValidationPipe } from "nestjs-zod";
import {
  CreateOfferingInput,
  CreateOfferingSchema,
} from "./dto/create-offering.dto";

@Controller("offerings")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @Get("available-for-transfer")
  async getAvailableForTransfer(
    @Query("termId") termId: string,
    @Query("excludeOfferingId") excludeOfferingId: string,
    @Query("level") level?: string,
  ) {
    return this.offeringsService.getOfferingsForTransfer(
      termId,
      excludeOfferingId,
      level,
    );
  }

  @Patch(":offeringId")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateOfferingInfo(
    @Param("offeringId") offeringId: string,
    @Body() body: { title: string },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.updateOfferingInfo(offeringId, body, staffUser);
  }

  @Post()
  @Roles("super_admin", "admin", "manager")
  async createOffering(
    @Body(new ZodValidationPipe(CreateOfferingSchema))
    body: CreateOfferingInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.createOffering(body, staffUser);
  }

  @Delete(":offeringId")
  @Roles("super_admin", "admin", "manager")
  async deleteOffering(
    @Param("offeringId") offeringId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.deleteOffering(offeringId, staffUser);
  }
}
