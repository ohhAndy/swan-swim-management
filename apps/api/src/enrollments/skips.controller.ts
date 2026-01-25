import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SkipsService } from "./skips.service";
import { AddSkipInput, addSkipSchema } from "./dto/skips.dto";

import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("enrollments/:enrollmentId/skips")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SkipsController {
  constructor(private readonly skipsService: SkipsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  async add(
    @Param("enrollmentId") enrollmentId: string,
    @Body(new ZodValidationPipe(addSkipSchema)) body: AddSkipInput,
    @CurrentUser() user: any,
  ) {
    return this.skipsService.addSkip(enrollmentId, body, user);
  }

  @Delete(":classSessionId")
  @Roles("super_admin", "admin", "manager")
  async delete(
    @Param("enrollmentId") enrollmentId: string,
    @Param("classSessionId") classSessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.skipsService.deleteSkip(enrollmentId, classSessionId, user);
  }
}
