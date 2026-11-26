import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import {
  CurrentLocationScope,
  fromBody,
  fromParam,
  LocationScope,
  ScopedTo,
} from "../auth/location-scope";
import { RequestStaffUser } from "../auth/auth.types";
import { SwimTeamService } from "./swim-team.service";
import {
  CreateRegistrationInput,
  CreateRegistrationSchema,
  FeePreviewQuery,
  FeePreviewQuerySchema,
  RegistrationQuery,
  RegistrationQuerySchema,
  UninvoicedRegistrationQuery,
  UninvoicedRegistrationQuerySchema,
  UpdateRegistrationInput,
  UpdateRegistrationSchema,
} from "./dto/swim-team.dto";
import {
  UpdateSwimTeamFeesInput,
  UpdateSwimTeamFeesSchema,
} from "../terms/dto/create-term.dto";

@Controller("swim-team")
@ScopedTo(fromParam("term", "termId"))
export class SwimTeamController {
  constructor(private readonly swimTeamService: SwimTeamService) {}

  @Get("seasons")
  @MinRole("supervisor")
  async getSeasons(@CurrentLocationScope() scope: LocationScope) {
    return this.swimTeamService.getSeasons(scope);
  }

  @Get("seasons/:termId/fee-preview")
  @MinRole("supervisor")
  async previewFees(
    @Param("termId") termId: string,
    @Query(new ZodValidationPipe(FeePreviewQuerySchema)) query: FeePreviewQuery,
  ) {
    return this.swimTeamService.previewFees(termId, query);
  }

  @Get("seasons/:termId/fees")
  @MinRole("manager")
  async getFees(@Param("termId") termId: string) {
    return this.swimTeamService.getFeeTiers(termId);
  }

  @Put("seasons/:termId/fees")
  @MinRole("admin")
  async updateFees(
    @Param("termId") termId: string,
    @Body(new ZodValidationPipe(UpdateSwimTeamFeesSchema))
    body: UpdateSwimTeamFeesInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.swimTeamService.updateFeeTiers(termId, body.tiers, staffUser);
  }

  @Get("registrations/uninvoiced")
  @MinRole("manager")
  async findUninvoiced(
    @Query(new ZodValidationPipe(UninvoicedRegistrationQuerySchema))
    query: UninvoicedRegistrationQuery,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.swimTeamService.findUninvoiced(query, scope);
  }

  @Get("registrations")
  @MinRole("supervisor")
  async findAll(
    @Query(new ZodValidationPipe(RegistrationQuerySchema))
    query: RegistrationQuery,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.swimTeamService.findAll(query, scope);
  }

  @Post("registrations")
  @MinRole("manager")
  @ScopedTo(fromBody("term", "termId"))
  async create(
    @Body(new ZodValidationPipe(CreateRegistrationSchema))
    body: CreateRegistrationInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.swimTeamService.createRegistration(body, staffUser);
  }

  @Patch("registrations/:id")
  @MinRole("manager")
  @ScopedTo(fromParam("swimTeamRegistration", "id"))
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRegistrationSchema))
    body: UpdateRegistrationInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.swimTeamService.updateRegistration(id, body, staffUser);
  }

  @Post("registrations/:id/withdraw")
  @MinRole("manager")
  @ScopedTo(fromParam("swimTeamRegistration", "id"))
  async withdraw(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.swimTeamService.withdraw(id, staffUser);
  }
}
