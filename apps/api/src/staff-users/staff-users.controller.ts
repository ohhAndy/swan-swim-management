import { Controller, Get, Param } from "@nestjs/common";
import { StaffUsersService } from "./staff-users.service";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";

// Staff accounts and roles are managed directly in the database; this
// controller only exposes the read lookups the web app needs.
@Controller("staff-users")
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
}
