import { Module } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { EnrollmentsModule } from "../enrollments/enrollment.module";

@Module({
  imports: [PrismaModule, AuditLogsModule, EnrollmentsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
