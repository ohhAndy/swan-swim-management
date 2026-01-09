import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

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

  async findAll(user: any) {
    // We still use the ID passed from controller (which comes from auth token) for filtering
    // But we might want to look up the StaffUser ID if userId is AuthID?
    // The previous controller logic passed req.user.id which is likely the AuthID.
    // However, the `create` method now looks up StaffUser by AuthID.
    // If `findAll` receives AuthID, we need to resolve it to StaffUser ID for `assignedToId` queries.
    // Wait, let's verify if `userId` passed here is AuthID or StaffUser ID.
    // In `TasksController`, `@CurrentUser() user` user.id is usually the AuthID from Supabase.
    // So we need to look up the StaffUser first.

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });

    // If no staff user found, return empty or throw?
    // Let's assume return empty for safety
    if (!staffUser) return [];

    const whereClause: any = {};

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

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: any) {
    // Ideally we should pass the user object here too for auditing
    // But the current signature usually only has (id, dto).
    // The controller needs to be updated to pass the user.
    // Let's assume validation happens in controller or we update signature.
    // Ideally we update signature to `update(id, dto, user)`

    // WAIT: The controller currently calls `this.tasksService.update(id, updateTaskDto)`
    // I need to update the controller to pass `user` as well.
    // But let's proceed with updating the service first, adding `user` param.

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

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
            changes: updateTaskDto as any,
          },
        },
      });

      return task;
    });
  }

  async remove(id: string, user: any) {
    // Similarly, need `user` for auditing
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

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
