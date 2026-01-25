import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { Roles } from "../auth/roles.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("audit-logs")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles("super_admin")
  async findAll(
    @Query("skip") skip?: string,
    @Query("take") take?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
    @Query("staffId") staffId?: string,
  ) {
    const where: any = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType)
      where.entityType = { contains: entityType, mode: "insensitive" };
    if (staffId) where.staffId = staffId;

    const [data, total] = await Promise.all([
      this.auditLogsService.findAll({
        skip: skip ? Number(skip) : 0,
        take: take ? Number(take) : 50,
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.auditLogsService.count(where),
    ]);

    return { data, total };
  }
}
