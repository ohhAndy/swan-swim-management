import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { MakeupsService } from "./makeups.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("makeups")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MakeupsController {
  constructor(private readonly makeupsService: MakeupsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body() body: { studentId: string; classSessionId: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.makeupsService.scheduleMakeUp(body, user);
  }
}
