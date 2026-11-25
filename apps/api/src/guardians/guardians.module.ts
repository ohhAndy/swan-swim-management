import { Module } from "@nestjs/common";
import { GuardiansService } from "./guardians.service";
import { GuardiansController } from "./guardians.controller";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [GuardiansController],
  providers: [GuardiansService],
  exports: [GuardiansService],
})
export class GuardiansModule {}