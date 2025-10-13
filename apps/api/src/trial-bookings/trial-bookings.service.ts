import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrialStatus } from '@prisma/client';

@Injectable()
export class TrialBookingsService {
  constructor(private prisma: PrismaService) {}

  async createTrialBooking(
    classSessionId: string,
    childName: string,
    childAge: number,
    parentPhone: string,
    notes: string | null,
    createdBy: any,
  ) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: createdBy.authId },
    });
    if(!user) return;

    // Verify session exists
    const session = await this.prisma.classSession.findUnique({
      where: { id: classSessionId },
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (childAge < 0 || childAge > 18) {
      throw new BadRequestException('Invalid age');
    }

    // Create trial booking with audit log
    return this.prisma.$transaction(async (tx) => {
      const trial = await tx.trialBooking.create({
        data: {
          classSessionId,
          childName,
          childAge,
          parentPhone,
          notes,
          status: 'scheduled',
          createdBy: user.id,
        },
        include: {
          classSession: {
            select: {
              id: true,
              date: true,
              offering: {
                select: {
                  title: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: 'Create Trial Booking',
          entityType: 'TrialBooking',
          entityId: trial.id,
          metadata: {
            childName,
            childAge,
            parentPhone,
            sessionDate: trial.classSession.date.toISOString(),
            offeringTitle: trial.classSession.offering.title,
          },
        },
      });

      return trial;
    });
  }

  async updateTrialStatus(
    trialId: string,
    status: TrialStatus,
    updatedBy: any,
  ) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: updatedBy.authId },
    });
    if(!user) return;

    const trial = await this.prisma.trialBooking.findUnique({
      where: { id: trialId },
      include: {
        classSession: {
          select: {
            date: true,
            offering: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!trial) {
      throw new NotFoundException('Trial booking not found');
    }

    // Don't allow status changes on converted trials
    if (trial.status === 'converted' && status !== 'converted') {
      throw new BadRequestException('Cannot change status of converted trial');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.trialBooking.update({
        where: { id: trialId },
        data: {
          status,
          updatedBy: user.id,
        },
        include: {
          updatedByUser: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: 'Update Trial Status',
          entityType: 'TrialBooking',
          entityId: trialId,
          metadata: {
            childName: trial.childName,
            oldStatus: trial.status,
            newStatus: status,
            sessionDate: trial.classSession.date.toISOString(),
            offeringTitle: trial.classSession.offering.title,
          },
        },
      });

      return updated;
    });
  }

  async convertToStudent(
    trialId: string,
    studentId: string,
    convertedBy: any,
  ) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: convertedBy.authId },
    });

    if(!user) return;
    const trial = await this.prisma.trialBooking.findUnique({
      where: { id: trialId },
    });

    if (!trial) {
      throw new NotFoundException('Trial booking not found');
    }

    if (trial.status === 'converted') {
      throw new BadRequestException('Trial already converted');
    }

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.trialBooking.update({
        where: { id: trialId },
        data: {
          status: 'converted',
          convertedAt: new Date(),
          convertedBy: user.id,
          convertedToStudentId: studentId,
        },
        include: {
          convertedByUser: {
            select: {
              fullName: true,
            },
          },
          convertedToStudent: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: 'Convert Trial to Student',
          entityType: 'TrialBooking',
          entityId: trialId,
          metadata: {
            trialChildName: trial.childName,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
          },
        },
      });

      return updated;
    });
  }

  async deleteTrialBooking(trialId: string, deletedBy: any) {
    const user = await this.prisma.staffUser.findUnique({
      where: { authId: deletedBy.authId },
    });
    if(!user) return;
    const trial = await this.prisma.trialBooking.findUnique({
      where: { id: trialId },
    });

    if (!trial) {
      throw new NotFoundException('Trial booking not found');
    }

    if (trial.status === 'converted') {
      throw new BadRequestException('Cannot delete converted trial');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          staffId: user.id,
          action: 'Delete Trial Booking',
          entityType: 'TrialBooking',
          entityId: trialId,
          metadata: {
            childName: trial.childName,
            childAge: trial.childAge,
            parentPhone: trial.parentPhone,
            status: trial.status,
          },
        },
      });

      return tx.trialBooking.delete({
        where: { id: trialId },
      });
    });
  }
}