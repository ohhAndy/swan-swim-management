import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestStaffUser } from "../auth/auth.types";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(staffUser: RequestStaffUser) {
    if (staffUser.role === "admin" || staffUser.role === "super_admin") {
      return this.prisma.location.findMany({
        orderBy: { name: "asc" },
      });
    }

    return staffUser.accessibleLocations || [];
  }
}
