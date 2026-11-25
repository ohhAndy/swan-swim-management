import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InventoryItemWhereUniqueInput;
    where?: Prisma.InventoryItemWhereInput;
    orderBy?: Prisma.InventoryItemOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const total = await this.prisma.inventoryItem.count({ where });

    const data = await this.prisma.inventoryItem.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });

    return {
      data,
      meta: {
        total,
        page: skip !== undefined && take ? Math.floor(skip / take) + 1 : 1,
        limit: take || total,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });
    if (!item)
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    return item;
  }

  async create(data: Prisma.InventoryItemCreateInput, staffUser: RequestStaffUser) {
    const item = await this.prisma.inventoryItem.create({
      data,
    });

    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "create",
        entityType: "inventory_item",
        entityId: item.id,
        changes: data as Prisma.InputJsonValue,
      });
    }

    return item;
  }

  async update(
    id: string,
    data: Prisma.InventoryItemUpdateInput,
    staffUser: RequestStaffUser,
  ) {
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data,
    });

    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "update",
        entityType: "inventory_item",
        entityId: item.id,
        changes: data as Prisma.InputJsonValue,
      });
    }

    return item;
  }

  async delete(id: string, staffUser: RequestStaffUser) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Item not found");

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: { active: false },
    });

    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "archive", // Soft delete
        entityType: "inventory_item",
        entityId: id,
        changes: { active: false },
      });
    }

    return updated;
  }
}
