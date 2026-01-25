import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AuditLogWhereUniqueInput;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.auditLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        staff: {
          select: { fullName: true, email: true, role: true },
        },
      },
    });
  }

  async count(where?: Prisma.AuditLogWhereInput) {
    return this.prisma.auditLog.count({ where });
  }

  async create(data: {
    staffId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        staffId: data.staffId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ?? Prisma.JsonNull,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });
  }
}
