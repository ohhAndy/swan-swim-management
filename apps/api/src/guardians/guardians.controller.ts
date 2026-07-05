import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { GuardiansService } from "./guardians.service";
import { ZodValidationPipe } from "nestjs-zod";
import {
  createGuardianSchema,
  updateGuardianSchema,
  searchGuardianSchema,
  SearchGuardianDto,
  CreateGuardianDto,
  UpdateGuardianDto,
} from "./dto/schemas.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("guardians")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  async searchOrList(
    @Query(new ZodValidationPipe(searchGuardianSchema))
    query: SearchGuardianDto,
  ) {
    return this.guardiansService.searchOrList(query);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.guardiansService.getById(id);
  }

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body(new ZodValidationPipe(createGuardianSchema)) body: CreateGuardianDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.guardiansService.create(body, staffUser);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGuardianSchema)) body: UpdateGuardianDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.guardiansService.update(id, body, staffUser);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async delete(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.guardiansService.delete(id, staffUser);
  }
}
