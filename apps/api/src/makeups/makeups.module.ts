import { Module } from "@nestjs/common";
import { MakeupsService } from "./makeups.service";
import { MakeupsController } from "./makeups.controller";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [MakeupsController],
  providers: [MakeupsService, PrismaService],
  exports: [MakeupsService],
})
export class MakeupsModule {}