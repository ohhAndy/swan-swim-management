import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { SwimTeamController } from "./swim-team.controller";
import { SwimTeamService } from "./swim-team.service";
import { SwimTeamStandingService } from "./swim-team-standing.service";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [SwimTeamController],
  providers: [SwimTeamService, SwimTeamStandingService],
  exports: [SwimTeamService, SwimTeamStandingService],
})
export class SwimTeamModule {}
