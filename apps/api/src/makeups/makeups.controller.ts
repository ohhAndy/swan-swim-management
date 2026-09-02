import { Body, Controller, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { MakeupsService } from "./makeups.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { ScheduleMakeUpInput, ScheduleMakeUpSchema } from "./dto/schedule-makeup.dto";

@Controller("makeups")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MakeupsController {
  constructor(private readonly makeupsService: MakeupsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body() body: ScheduleMakeUpInput,
    @Res({ passthrough: true }) res: Response,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    const validated = ScheduleMakeUpSchema.parse(body);
    const result = await this.makeupsService.scheduleMakeUp(validated, staffUser);

    // No resource was created — return 200 instead of 201
    if ("requiresOverride" in result && result.requiresOverride) {
      res.status(200);
    }

    return result;
  }
}
