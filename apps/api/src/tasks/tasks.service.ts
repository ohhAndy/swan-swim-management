import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, Task } from "@prisma/client";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { RequestStaffUser } from "../auth/auth.types";
import { hasMinRole } from "../auth/roles";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.TaskInclude;

function canAccessAllTasks(staffUser: RequestStaffUser) {
  return hasMinRole(staffUser.role, "manager");
}

function isOwnTask(task: Task, staffUser: RequestStaffUser) {
  return (
    task.assignedToId === staffUser.id || task.createdById === staffUser.id
  );
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, staffUser: RequestStaffUser) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          priority: createTaskDto.priority,
          dueDate: createTaskDto.dueDate
            ? new Date(createTaskDto.dueDate)
            : undefined,
          assignedToId: createTaskDto.assignedToId,
          createdById: staffUser.id,
        },
        include: TASK_INCLUDE,
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Create Task",
          entityType: "Task",
          entityId: task.id,
          metadata: {
            title: task.title,
            assignedToId: task.assignedToId,
            priority: task.priority,
          },
        },
        tx,
      );

      return task;
    });
  }

  async findAll(staffUser: RequestStaffUser) {
    const where: Prisma.TaskWhereInput = canAccessAllTasks(staffUser)
      ? {}
      : { OR: [{ assignedToId: staffUser.id }, { createdById: staffUser.id }] };

    return this.prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, staffUser: RequestStaffUser) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });

    if (!task || (!canAccessAllTasks(staffUser) && !isOwnTask(task, staffUser))) {
      throw new NotFoundException("Task not found");
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, staffUser: RequestStaffUser) {
    const existingTask = await this.prisma.task.findUnique({ where: { id } });
    if (!existingTask) throw new NotFoundException("Task not found");

    if (!canAccessAllTasks(staffUser) && !isOwnTask(existingTask, staffUser)) {
      throw new ForbiddenException("You can only update tasks assigned to or created by you");
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: {
          ...updateTaskDto,
          dueDate: updateTaskDto.dueDate
            ? new Date(updateTaskDto.dueDate)
            : undefined,
        },
        include: TASK_INCLUDE,
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Update Task",
          entityType: "Task",
          entityId: task.id,
          metadata: {
            title: task.title,
            changes: updateTaskDto as Prisma.InputJsonValue,
          },
        },
        tx,
      );

      return task;
    });
  }

  async remove(id: string, staffUser: RequestStaffUser) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");

    return this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Delete Task",
          entityType: "Task",
          entityId: id,
          metadata: {
            title: task.title,
          },
        },
        tx,
      );

      return tx.task.delete({
        where: { id },
      });
    });
  }
}
