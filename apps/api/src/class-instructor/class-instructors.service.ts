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
    staffUserId: string,
    assignedBy: any,
  ) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: assignedBy.authId },
    });
    if(!user) return;

    // Verify class offering exists
    const classOffering = await this.prisma.classOffering.findUnique({
      where: { id: classOfferingId },
    });
    if (!classOffering) {
      throw new NotFoundException("Class offering not found");
    }

    // Verify staff user exists
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId },
    });
    if (!staffUser) {
      throw new NotFoundException("Staff user not found");
    }

    // Check if already assigned (active assignment)
    const existing = await this.prisma.classInstructor.findFirst({
      where: {
        classOfferingId,
        staffUserId,
        removedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        "This instructor is already assigned to this class"
      );
    }

    // Create assignment
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.classInstructor.create({
        data: {
          classOfferingId,
          staffUserId,
          assignedBy: user.id,
        },
        include: {
          staffUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
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
          action: 'Assign Instructor',
          entityType: 'ClassInstructor',
          entityId: assignment.id,
          metadata: {
            classOfferingTitle: classOffering.title,
            instructorName: staffUser.fullName,
            instructorId: staffUser.id,
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
    if(!user) return;

    const assignment = await this.prisma.classInstructor.findUnique({
      where: { id: assignmentId },
      include: {
        staffUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
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
          staffUser: {
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
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: 'Remove Instructor',
          entityType: 'ClassInstructor',
          entityId: assignmentId,
          metadata: {
            classOfferingTitle: assignment.classOffering.title,
            instructorName: assignment.staffUser.fullName,
            instructorId: assignment.staffUser.id,
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
        staffUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
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
        staffUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
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

  async getClassesForInstructor(staffUserId: string, activeOnly = true) {
    return this.prisma.classInstructor.findMany({
      where: {
        staffUserId,
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
