import { Module } from "@nestjs/common";
import { MakeupsService } from "./makeups.service";
import { MakeupsController } from "./makeups.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { TokensModule } from "../tokens/tokens.module";

@Module({
  imports: [PrismaModule, AuditLogsModule, TokensModule],
  controllers: [MakeupsController],
  providers: [MakeupsService],
  exports: [MakeupsService],
})
export class MakeupsModule {}