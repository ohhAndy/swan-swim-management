import { Controller, Get, UseGuards } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth.types";

@Controller("locations")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.locationsService.findAll(user);
  }
}
