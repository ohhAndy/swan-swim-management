import { Module } from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { OfferingsController } from "./offerings.controller";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [OfferingsController],
  providers: [OfferingsService, PrismaService],
  exports: [OfferingsService],
})
export class OfferingsModule {}