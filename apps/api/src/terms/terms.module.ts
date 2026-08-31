import { Module } from "@nestjs/common";
import { TermsService } from "./terms.service";
import { TermScheduleService } from "./term-schedule.service";
import { TermAvailabilityService } from "./term-availability.service";
import { TermsController } from "./terms.controller";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [TermsController],
  providers: [
    TermsService,
    TermScheduleService,
    TermAvailabilityService,
    PrismaService,
  ],
  exports: [TermsService, TermScheduleService, TermAvailabilityService],
})
export class TermsModule {}