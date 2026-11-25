import { Controller, Get } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(@CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.locationsService.findAll(staffUser);
  }
}
