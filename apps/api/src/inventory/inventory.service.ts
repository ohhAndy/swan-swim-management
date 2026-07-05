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

    // Get total count (for pagination)
    const total = await this.prisma.inventoryItem.count({ where });

    // Get data
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

    // Soft delete or Hard delete?
    // Schema has 'active' but implementation plan implies standard CRUD.
    // Let's assume soft delete via update to 'active: false' is safer for history,
    // but typically delete means delete unless specified.
    // However, if we delete, we break invoice line items?
    // Schema relation InventoryItem -> InvoiceLineItem is optional? No, LineItem -> InventoryItem is optional.
    // Check schema: `inventoryItem   InventoryItem? @relation(fields: [inventoryItemId], references: [id])`
    // No onDelete behavior specified, defaults to Restrict usually in Prisma unless SetNull.
    // Let's use soft delete (active = false) to be safe.

    // Actually, let's allow hard delete if no relations, otherwise fail.
    // But checking relations is expensive.
    // Let's try update active = false first.

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
