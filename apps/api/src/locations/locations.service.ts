import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });

    if (!staffUser) return [];

    if (staffUser.role === "admin") {
      return this.prisma.location.findMany({
        orderBy: { name: "asc" },
      });
    }

    return staffUser.accessibleLocations;
  }
}
