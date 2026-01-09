import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClassInstructorsService {
  constructor(private prisma: PrismaService) {}

  async assignInstructor(
    classOfferingId: string,
    instructorId: string,
    assignedByKey: any
  ) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: assignedByKey.authId },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify class offering exists
    const classOffering = await this.prisma.classOffering.findUnique({
      where: { id: classOfferingId },
    });
    if (!classOffering) {
      throw new NotFoundException("Class offering not found");
    }

    // Verify instructor exists
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException("Instructor not found");
    }

    // Perform check and create atomically
    return this.prisma.$transaction(async (tx) => {
      // Check if already assigned (active assignment)
      const existing = await tx.classInstructor.findFirst({
        where: {
          classOfferingId,
          instructorId,
          removedAt: null,
        },
      });

      if (existing) {
        throw new ConflictException(
          "This instructor is already assigned to this class"
        );
      }

      const assignment = await tx.classInstructor.create({
        data: {
          classOfferingId,
          instructorId,
          assignedBy: user.id,
        },
        include: {
          instructor: true,
          assignedByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: "Assign Instructor",
          entityType: "ClassInstructor",
          entityId: assignment.id,
          metadata: {
            classOfferingTitle: classOffering.title,
            instructorName: `${instructor.firstName} ${instructor.lastName}`,
            instructorId: instructor.id,
          },
        },
      });

      return assignment;
    });
  }

  async removeInstructor(assignmentId: string, removedBy: any) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: removedBy.authId },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const assignment = await this.prisma.classInstructor.findUnique({
      where: { id: assignmentId },
      include: {
        instructor: true,
        classOffering: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException("Instructor assignment not found");
    }

    if (assignment.removedAt) {
      throw new ConflictException(
        "This instructor assignment is already removed"
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.classInstructor.update({
        where: { id: assignmentId },
        data: {
          removedAt: new Date(),
          removedBy: user.id,
        },
        include: {
          instructor: true,
          removedByUser: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: "Remove Instructor",
          entityType: "ClassInstructor",
          entityId: assignmentId,
          metadata: {
            classOfferingTitle: assignment.classOffering.title,
            instructorName: `${assignment.instructor.firstName} ${assignment.instructor.lastName}`,
            instructorId: assignment.instructor.id,
          },
        },
      });

      return updated;
    });
  }

  async getActiveInstructorsForClass(classOfferingId: string) {
    return this.prisma.classInstructor.findMany({
      where: {
        classOfferingId,
        removedAt: null,
      },
      include: {
        instructor: true,
      },
      orderBy: {
        assignedAt: "asc",
      },
    });
  }

  async getInstructorHistory(classOfferingId: string) {
    return this.prisma.classInstructor.findMany({
      where: {
        classOfferingId,
      },
      include: {
        instructor: true,
        assignedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        removedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
  }

  async getClassesForInstructor(instructorId: string, activeOnly = true) {
    return this.prisma.classInstructor.findMany({
      where: {
        instructorId,
        ...(activeOnly ? { removedAt: null } : {}),
      },
      include: {
        classOffering: {
          include: {
            term: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
  }
}
