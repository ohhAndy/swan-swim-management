import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class StaffUsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

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

  async findByAuthId(authId: string) {
    return this.prisma.staffUser.findUnique({
      where: { authId },
      select: {
        id: true,
        authId: true,
        email: true,
        fullName: true,
        role: true,
        active: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.staffUser.findUnique({
      where: { email },
    });
  }

  async createStaffUser(
    data: {
      authId: string;
      email: string;
      fullName: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
    adminUser: any,
  ) {
    const newUser = await this.prisma.staffUser.create({
      data: {
        authId: data.authId,
        email: data.email,
        fullName: data.fullName,
        role: data.role || "viewer",
        active: true,
        accessSchedule: data.accessSchedule as any,
      },
    });

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: adminUser.authId },
    });
    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "create",
        entityType: "staff_user",
        entityId: newUser.id,
        changes: {
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName,
        },
      });
    }

    return newUser;
  }

  async updateStaffUser(
    id: string,
    data: {
      fullName?: string;
      role?: "admin" | "manager" | "supervisor" | "viewer";
      active?: boolean;
      accessSchedule?: Record<string, { start: string; end: string }[]>;
    },
    adminUser: any,
  ) {
    const updatedUser = await this.prisma.staffUser.update({
      where: { id },
      data: {
        ...data,
        accessSchedule: data.accessSchedule as any,
      },
    });

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: adminUser.authId },
    });
    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "update",
        entityType: "staff_user",
        entityId: id,
        changes: data as any,
      });
    }

    return updatedUser;
  }
}
