import { Controller, Get, Param, Post, Body, Patch } from "@nestjs/common";
import { StaffUsersService } from "./staff-users.service";
import { Public } from "../auth/public.decorator";

@Controller("staff-users")
export class StaffUsersController {
  constructor(private readonly staffUsersService: StaffUsersService) {}

  @Get()
  async findAll() {
    return this.staffUsersService.findAll();
  }

  @Public()
  @Get("by-auth/:authId")
  async getByAuthId(@Param("authId") authId: string) {
    return this.staffUsersService.findByAuthId(authId);
  }

  @Post()
  async createStaffUser(
    @Body()
    body: {
      authId: string;
      email: string;
      fullName: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
  ) {
    return this.staffUsersService.createStaffUser(body);
  }

  @Patch(":id")
  async updateStaffUser(
    @Param("id") id: string,
    @Body()
    body: {
      fullName?: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      active?: boolean;
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
  ) {
    return this.staffUsersService.updateStaffUser(id, body);
  }
}
