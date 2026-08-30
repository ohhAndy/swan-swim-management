import { Module } from "@nestjs/common";
import { TermsService } from "./terms.service";
import { TermsController } from "./terms.controller";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [TermsController],
  providers: [TermsService, PrismaService],
  exports: [TermsService],
})
export class TermsModule {}