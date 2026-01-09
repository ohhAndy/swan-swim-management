import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  async create(createInstructorDto: CreateInstructorDto, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) {
      throw new NotFoundException("Staff user not found");
    }

    const instructor = await this.prisma.instructor.create({
      data: {
        ...createInstructorDto,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        staffId: staffUser.id,
        action: "Create Instructor",
        entityType: "Instructor",
        entityId: instructor.id,
        metadata: {
          name: `${instructor.firstName} ${instructor.lastName}`,
        },
      },
    });

    return instructor;
  }

  async findAll(activeOnly = false) {
    return this.prisma.instructor.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { lastName: "asc" },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
    });
    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }
    return instructor;
  }

  async update(
    id: string,
    updateInstructorDto: UpdateInstructorDto,
    user: any
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) {
      throw new NotFoundException("Staff user not found");
    }

    const instructor = await this.prisma.instructor.update({
      where: { id },
      data: updateInstructorDto,
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        staffId: staffUser.id,
        action: "Update Instructor",
        entityType: "Instructor",
        entityId: instructor.id,
        metadata: {
          name: `${instructor.firstName} ${instructor.lastName}`,
          changes: updateInstructorDto as any,
        },
      },
    });

    return instructor;
  }

  async remove(id: string, removedBy: any) {
    // Soft delete by setting isActive to false, or hard delete?
    // User asked to verify separate lifecycle. Usually soft delete is better, but allow hard delete if no relations?
    // Plan said "Delete (soft)".
    return this.update(id, { isActive: false }, removedBy);
  }
}
