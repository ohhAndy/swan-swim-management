import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { Roles } from "../auth/roles.decorator";
import { Prisma } from "@prisma/client";
import { ZodValidationPipe } from "nestjs-zod";
import { AuditLogQueryDto, AuditLogQuerySchema } from "./dto/audit-log-query.dto";
import { torontoDayRange } from "../common/date.utils";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles("super_admin")
  async findAll(
    @Query(new ZodValidationPipe(AuditLogQuerySchema))
    { skip, take, action, entityType, staffId, startDate, endDate }: AuditLogQueryDto,
  ) {
    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType)
      where.entityType = { contains: entityType, mode: "insensitive" };
    if (staffId) where.staffId = staffId;
    const createdAt = torontoDayRange(startDate, endDate);
    if (createdAt) where.createdAt = createdAt;

    const [data, total] = await Promise.all([
      this.auditLogsService.findAll({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.auditLogsService.count(where),
    ]);

    return { data, total };
  }
}
