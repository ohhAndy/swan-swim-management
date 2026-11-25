import { Controller, Get } from "@nestjs/common";
import { StaffUsersService } from "./staff-users.service";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("staff-users")
export class StaffUsersController {
  constructor(private readonly staffUsersService: StaffUsersService) {}

  @Get()
  @MinRole("admin")
  async findAll() {
    return this.staffUsersService.findAll();
  }

  @Get("me")
  me(@CurrentStaffUser() staffUser: RequestStaffUser) {
    const { id, authId, email, fullName, role, active } = staffUser;
    return { id, authId, email, fullName, role, active };
  }
}
