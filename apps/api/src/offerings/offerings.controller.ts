import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Post,
  Delete,
} from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { ZodValidationPipe } from "nestjs-zod";
import {
  CreateOfferingInput,
  CreateOfferingSchema,
} from "./dto/create-offering.dto";
import {
  TransferOptionsQueryDto,
  TransferOptionsQuerySchema,
  UpdateOfferingInfoDto,
  UpdateOfferingInfoSchema,
} from "./dto/offering-updates.dto";

@Controller("offerings")
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @Get("available-for-transfer")
  async getAvailableForTransfer(
    @Query(new ZodValidationPipe(TransferOptionsQuerySchema))
    q: TransferOptionsQueryDto,
  ) {
    return this.offeringsService.getOfferingsForTransfer(
      q.termId,
      q.excludeOfferingId,
      q.level,
    );
  }

  @Patch(":offeringId")
  @MinRole("supervisor")
  async updateOfferingInfo(
    @Param("offeringId") offeringId: string,
    @Body(new ZodValidationPipe(UpdateOfferingInfoSchema))
    body: UpdateOfferingInfoDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.updateOfferingInfo(offeringId, body, staffUser);
  }

  @Post()
  @MinRole("manager")
  async createOffering(
    @Body(new ZodValidationPipe(CreateOfferingSchema))
    body: CreateOfferingInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.createOffering(body, staffUser);
  }

  @Delete(":offeringId")
  @MinRole("manager")
  async deleteOffering(
    @Param("offeringId") offeringId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.offeringsService.deleteOffering(offeringId, staffUser);
  }
}
