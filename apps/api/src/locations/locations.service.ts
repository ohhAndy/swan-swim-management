import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../auth/auth.types";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });

    if (!staffUser) return [];

    if (staffUser.role === "admin" || staffUser.role === "super_admin") {
      return this.prisma.location.findMany({
        orderBy: { name: "asc" },
      });
    }

    return staffUser.accessibleLocations;
  }
}
