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
import { CurrentUser } from "../auth/current-user.decorator";
import { Prisma } from "@prisma/client";

@Controller("inventory")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  create(
    @Body() data: Prisma.InventoryItemCreateInput,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.create(data, user);
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
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.update(id, data, user);
  }

  @Delete(":id")
  @Roles("super_admin", "admin")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.inventoryService.delete(id, user);
  }
}
