import { Module } from "@nestjs/common";
import { CommunicationsController } from "./communications.controller";
import { CommunicationsService } from "./communications.service";
import { EmailDispatchService } from "./email-dispatch.service";
import { ResendRateLimiter } from "./resend-rate-limiter";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, EmailDispatchService, ResendRateLimiter],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
