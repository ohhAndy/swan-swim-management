import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { CronTasksService } from "./cron-tasks.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [TasksController],
  providers: [TasksService, CronTasksService, PrismaService],
  exports: [CronTasksService],
})
export class TasksModule {}
