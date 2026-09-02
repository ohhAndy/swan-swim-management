import { Module } from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollmentsController } from "./enrollments.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { TokensModule } from "../tokens/tokens.module";

@Module({
  imports: [PrismaModule, AuditLogsModule, TokensModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}