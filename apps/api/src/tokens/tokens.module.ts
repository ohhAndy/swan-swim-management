import { Module } from "@nestjs/common";
import { TokensService } from "./tokens.service";
import { TokensController } from "./tokens.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
