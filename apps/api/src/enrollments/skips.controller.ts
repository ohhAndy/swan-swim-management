import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SkipsService } from "./skips.service";
import { AddSkipInput, addSkipSchema } from "./dto/skips.dto";

import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("enrollments/:enrollmentId/skips")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SkipsController {
  constructor(private readonly skipsService: SkipsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  async add(
    @Param("enrollmentId") enrollmentId: string,
    @Body(new ZodValidationPipe(addSkipSchema)) body: AddSkipInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.skipsService.addSkip(enrollmentId, body, staffUser);
  }

  @Delete(":classSessionId")
  @Roles("super_admin", "admin", "manager")
  async delete(
    @Param("enrollmentId") enrollmentId: string,
    @Param("classSessionId") classSessionId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.skipsService.deleteSkip(enrollmentId, classSessionId, staffUser);
  }
}
