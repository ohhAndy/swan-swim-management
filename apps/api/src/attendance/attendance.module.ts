import { Module } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { AttendanceController } from "./attendance.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { TokensModule } from "../tokens/tokens.module";

@Module({
  imports: [PrismaModule, AuditLogsModule, TokensModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}