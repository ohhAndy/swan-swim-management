import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { TasksService } from "./tasks.service";
import { CronTasksService } from "./cron-tasks.service";
import { CreateTaskDto, CreateTaskSchema } from "./dto/create-task.dto";
import { UpdateTaskDto, UpdateTaskSchema } from "./dto/update-task.dto";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly cronTasksService: CronTasksService,
  ) {}

  @Post("cron/deactivate-expired")
  @Roles("super_admin", "admin")
  triggerDeactivateExpired() {
    return this.cronTasksService.deactivateExpiredEnrollments();
  }

  @Post()
  @Roles("super_admin", "admin", "manager", "supervisor")
  create(
    @Body(new ZodValidationPipe(CreateTaskSchema)) createTaskDto: CreateTaskDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.tasksService.create(createTaskDto, staffUser);
  }

  @Get()
  @Roles("super_admin", "admin", "manager", "supervisor")
  findAll(@CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.tasksService.findAll(staffUser);
  }

  @Get(":id")
  @Roles("super_admin", "admin", "manager", "supervisor")
  findOne(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.tasksService.findOne(id, staffUser);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager", "supervisor")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) updateTaskDto: UpdateTaskDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.tasksService.update(id, updateTaskDto, staffUser);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.tasksService.remove(id, staffUser);
  }
}
