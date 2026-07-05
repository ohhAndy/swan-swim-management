import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { MakeupsService } from "./makeups.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("makeups")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MakeupsController {
  constructor(private readonly makeupsService: MakeupsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body()
    body: {
      studentId: string;
      classSessionId: string;
      notes?: string;
      classRatio?: string;
    },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.makeupsService.scheduleMakeUp(body, staffUser);
  }
}
