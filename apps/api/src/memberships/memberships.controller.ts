import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MembershipsService } from "./memberships.service";
import {
  CreateMembershipDto,
  CreateMembershipSchema,
  UpdateMembershipDto,
  UpdateMembershipSchema,
  UninvoicedMembershipsQueryDto,
} from "./dto/membership.dto";
import { ZodValidationPipe } from "nestjs-zod";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("memberships")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager", "supervisor")
  async create(
    @Body(new ZodValidationPipe(CreateMembershipSchema))
    dto: CreateMembershipDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.membershipsService.create(dto, staffUser);
  }

  @Get("uninvoiced")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async getUninvoiced(
    @Query() query: UninvoicedMembershipsQueryDto,
  ) {
    return this.membershipsService.getUninvoiced(query);
  }

  @Get()
  @Roles("super_admin", "admin", "manager", "supervisor")
  async findAll(
    @Query("status") status?: string,
    @Query("studentId") studentId?: string,
  ) {
    return this.membershipsService.findAll({ status, studentId });
  }

  @Get(":id")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async findById(@Param("id") id: string) {
    return this.membershipsService.findById(id);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateMembershipSchema))
    dto: UpdateMembershipDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.membershipsService.update(id, dto, staffUser);
  }
}
