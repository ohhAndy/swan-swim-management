import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StaffUsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staffUser.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });
  }
}
