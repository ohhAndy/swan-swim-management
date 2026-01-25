import { Module } from "@nestjs/common";
import { SkipsService } from "./skips.service";
import { SkipsController } from "./skips.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [SkipsController],
  providers: [SkipsService],
  exports: [SkipsService],
})
export class SkipsModule {}
