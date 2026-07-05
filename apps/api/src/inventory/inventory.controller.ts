import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { Prisma } from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("inventory")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  create(
    @Body() data: Prisma.InventoryItemCreateInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.inventoryService.create(data, staffUser);
  }

  @Get()
  @Roles("super_admin", "admin", "manager", "viewer")
  findAll(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("search") search?: string,
    @Query("active") active?: string,
  ) {
    const where: Prisma.InventoryItemWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (active !== undefined) {
      where.active = active === "true";
    }

    return this.inventoryService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { name: "asc" },
    });
  }

  @Get(":id")
  @Roles("super_admin", "admin", "manager", "viewer")
  findOne(@Param("id") id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  update(
    @Param("id") id: string,
    @Body() data: Prisma.InventoryItemUpdateInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.inventoryService.update(id, data, staffUser);
  }

  @Delete(":id")
  @Roles("super_admin", "admin")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.inventoryService.delete(id, staffUser);
  }
}
