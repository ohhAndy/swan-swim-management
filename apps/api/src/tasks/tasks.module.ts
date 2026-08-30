import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { CronTasksService } from "./cron-tasks.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [TasksController],
  providers: [TasksService, CronTasksService, PrismaService],
  exports: [CronTasksService],
})
export class TasksModule {}
