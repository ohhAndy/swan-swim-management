import { Module } from "@nestjs/common";
import { StaffUsersService } from "./staff-users.service";
import { StaffUsersController } from "./staff-users.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [StaffUsersController],
  providers: [StaffUsersService],
  exports: [StaffUsersService],
})
export class StaffUsersModule {}
