import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("tasks")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles("admin", "manager", "supervisor")
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @Roles("admin", "manager", "supervisor")
  findAll(@CurrentUser() user: any) {
    return this.tasksService.findAll(user);
  }

  @Get(":id")
  @Roles("admin", "manager", "supervisor")
  findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(":id")
  @Roles("admin", "manager", "supervisor")
  update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(":id")
  @Roles("admin", "manager")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user);
  }
}
