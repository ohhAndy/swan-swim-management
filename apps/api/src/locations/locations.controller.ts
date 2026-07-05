import { Controller, Get, UseGuards } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("locations")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(@CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.locationsService.findAll(staffUser);
  }
}
