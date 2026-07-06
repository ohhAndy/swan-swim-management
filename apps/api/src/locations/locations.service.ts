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

    const locationIds = staffUser.accessibleLocations?.map((l) => l.id) || [];
    return this.prisma.location.findMany({
      where: {
        id: { in: locationIds },
      },
      orderBy: { name: "asc" },
    });
  }
}
