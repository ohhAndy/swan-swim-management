import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { RequestStaffUser } from "../auth/auth.types";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          assignedTo: true,
          createdBy: true,
        },
      });

      await tx.auditLog.create({
        data: {
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
      });

      return task;
    });
  }

  async findAll(staffUser: RequestStaffUser) {

    const whereClause: Prisma.TaskWhereInput = {};

    if (staffUser.role !== "admin" && staffUser.role !== "manager") {
      whereClause.OR = [
        { assignedToId: staffUser.id },
        { createdById: staffUser.id },
      ];
    }

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, staffUser: RequestStaffUser) {

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!task) return null;

    // Access control
    if (staffUser.role !== "admin" && staffUser.role !== "manager") {
      if (
        task.assignedToId !== staffUser.id &&
        task.createdById !== staffUser.id
      ) {
        // Return null or throw ForbiddenException?
        // Returning null mimics "not found" which is safer for security.
        return null;
      }
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, staffUser: RequestStaffUser) {

    // Check existing task for permission
    const existingTask = await this.prisma.task.findUnique({ where: { id } });
    if (!existingTask) return; // or throw

    if (staffUser.role !== "admin" && staffUser.role !== "manager") {
      if (
        existingTask.assignedToId !== staffUser.id &&
        existingTask.createdById !== staffUser.id
      ) {
        // User not allowed to update this task
        throw new Error("Unauthorized to update this task");
      }
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
        include: {
          assignedTo: true,
          createdBy: true,
        },
      });

      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Update Task",
          entityType: "Task",
          entityId: task.id,
          metadata: {
            title: task.title,
            changes: updateTaskDto as Prisma.InputJsonValue,
          },
        },
      });

      return task;
    });
  }

  async remove(id: string, staffUser: RequestStaffUser) {

    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) return; // Or throw

    return this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Delete Task",
          entityType: "Task",
          entityId: id,
          metadata: {
            title: task.title,
          },
        },
      });

      return tx.task.delete({
        where: { id },
      });
    });
  }
}
