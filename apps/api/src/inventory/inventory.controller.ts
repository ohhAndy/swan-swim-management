import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { InventoryService } from "./inventory.service";
import {
  CreateInventoryItemDto,
  CreateInventoryItemSchema,
  InventoryQueryDto,
  InventoryQuerySchema,
  UpdateInventoryItemDto,
  UpdateInventoryItemSchema,
} from "./dto/inventory.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { Prisma } from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @MinRole("manager")
  create(
    @Body(new ZodValidationPipe(CreateInventoryItemSchema))
    data: CreateInventoryItemDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.inventoryService.create(data, staffUser);
  }

  @Get()
  @MinRole("manager")
  findAll(
    @Query(new ZodValidationPipe(InventoryQuerySchema)) q: InventoryQueryDto,
  ) {
    const where: Prisma.InventoryItemWhereInput = {};
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: "insensitive" } },
        { sku: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.active !== undefined) {
      where.active = q.active;
    }

    return this.inventoryService.findAll({
      skip: q.skip,
      take: q.take,
      where,
      orderBy: { name: "asc" },
    });
  }

  @Get(":id")
  @MinRole("manager")
  findOne(@Param("id") id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(":id")
  @MinRole("manager")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateInventoryItemSchema))
    data: UpdateInventoryItemDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.inventoryService.update(id, data, staffUser);
  }

  @Delete(":id")
  @MinRole("admin")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.inventoryService.delete(id, staffUser);
  }
}
