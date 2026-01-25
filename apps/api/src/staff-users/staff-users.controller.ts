import { Controller, Get, Param, Post, Body, Patch } from "@nestjs/common";
import { StaffUsersService } from "./staff-users.service";
import { Public } from "../auth/public.decorator";

import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("staff-users")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StaffUsersController {
  constructor(private readonly staffUsersService: StaffUsersService) {}

  @Get()
  @Roles("super_admin", "admin")
  async findAll() {
    return this.staffUsersService.findAll();
  }

  @Public()
  @Get("by-auth/:authId")
  async getByAuthId(@Param("authId") authId: string) {
    return this.staffUsersService.findByAuthId(authId);
  }

  @Post()
  @Roles("super_admin", "admin")
  async createStaffUser(
    @Body()
    body: {
      authId: string;
      email: string;
      fullName: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
    @CurrentUser() user: any,
  ) {
    return this.staffUsersService.createStaffUser(body, user);
  }

  @Patch(":id")
  @Roles("super_admin", "admin")
  async updateStaffUser(
    @Param("id") id: string,
    @Body()
    body: {
      fullName?: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      active?: boolean;
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
    @CurrentUser() user: any,
  ) {
    return this.staffUsersService.updateStaffUser(id, body, user);
  }
}
