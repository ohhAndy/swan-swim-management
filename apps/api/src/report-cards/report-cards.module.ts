import { Module } from "@nestjs/common";
import { ReportCardsService } from "./report-cards.service";
import { ReportCardsController } from "./report-cards.controller";
import { CommunicationsModule } from "../communications/communications.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [CommunicationsModule, AuditLogsModule, PrismaModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
})
export class ReportCardsModule {}
