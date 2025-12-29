import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollWithSkipInput } from "./dto/enrollment.dto";
import { TransferEnrollmentDto } from "./dto/transfer.dto";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async updateRemarks(enrollmentId: string, body: any, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const currEnrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        notes: true,
      },
    });
    if (!currEnrollment) throw new NotFoundException("Enrollment DNE");

    if (currEnrollment) {
      const updated = await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          notes: body.remarks,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Update Remarks",
          entityType: "Enrollment",
          entityId: updated.id,
          changes: {
            status: { from: currEnrollment.notes, to: updated.notes },
          },
        },
      });
    }

    return {
      success: true,
      notes: body.remarks,
    };
  }

  async transferEnrollment(
    enrollmentId: string,
    dto: TransferEnrollmentDto,
    user: any
  ) {
    const { targetOfferingId, skippedSessionIds, transferNotes } = dto;

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const currEnrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        offering: {
          include: { term: true },
        },
        student: true,
      },
    });
    if (!currEnrollment) throw new NotFoundException("Enrollment DNE");
    if (currEnrollment.status !== "active")
      throw new BadRequestException("Enrollment is not active!");

    const targetOffering = await this.prisma.classOffering.findUnique({
      where: { id: targetOfferingId },
      include: { term: true },
    });

    if (!targetOffering)
      throw new NotFoundException("Target offering not found");
    if (targetOffering.termId !== currEnrollment.offering.termId) {
      throw new BadRequestException("Can only transfer within the same term");
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        offeringId_studentId: {
          offeringId: targetOfferingId,
          studentId: currEnrollment.studentId,
        },
      },
    });
    if (existingEnrollment)
      throw new BadRequestException("Student already enrolled");

    return await this.prisma.$transaction(async (tx) => {
      // Create new enrollment
      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId: currEnrollment.studentId,
          offeringId: targetOfferingId,
          status: "active",
          enrollDate: new Date(),
          transferredFromId: enrollmentId,
          createdBy: staffUser.id,
        },
      });

      // Create skips for new enrollment
      if (skippedSessionIds.length > 0) {
        await tx.enrollmentSkip.createMany({
          data: skippedSessionIds.map((sessionId) => ({
            enrollmentId: newEnrollment.id,
            classSessionId: sessionId,
          })),
        });
      }

      // Update old enrollment to transferred status
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "transferred",
          transferredToId: newEnrollment.id,
          transferredAt: new Date(),
          transferNotes: transferNotes || null,
          transferredBy: staffUser?.id ?? null,
        },
      });

      // Create audit log for transfer
      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Transfer Enrollment",
          entityType: "Enrollment",
          entityId: enrollmentId,
          changes: {
            status: { from: "active", to: "transferred" },
            offeringId: {
              from: currEnrollment.offeringId,
              to: targetOfferingId,
            },
          },
          metadata: {
            studentId: currEnrollment.studentId,
            studentName: `${currEnrollment.student.firstName} ${currEnrollment.student.lastName}`,
            oldOfferingId: currEnrollment.offeringId,
            newOfferingId: targetOfferingId,
            newEnrollmentId: newEnrollment.id,
            skippedSessionIds: skippedSessionIds,
            transferNotes: transferNotes || null,
          },
        },
      });

      // Create audit log for new enrollment creation
      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Create Enrollment",
          entityType: "Enrollment",
          entityId: newEnrollment.id,
          changes: {
            status: { from: null, to: "active" },
            offeringId: { from: null, to: targetOfferingId },
          },
          metadata: {
            studentId: currEnrollment.studentId,
            studentName: `${currEnrollment.student.firstName} ${currEnrollment.student.lastName}`,
            offeringId: targetOfferingId,
            transferredFrom: enrollmentId,
            skipsCreated: skippedSessionIds.length,
          },
        },
      });

      return {
        success: true,
        oldEnrollmentId: enrollmentId,
        newEnrollmentId: newEnrollment.id,
      };
    });
  }

  async enrollWithSkips(input: EnrollWithSkipInput, user: any) {
    const { studentId, offeringId, skippedDates, classRatio } = input;

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    const offering = await this.prisma.classOffering.findUnique({
      where: { id: offeringId },
      include: { term: true },
    });
    if (!offering) throw new NotFoundException("Offering not found");

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        offeringId_studentId: {
          offeringId,
          studentId,
        },
      },
    });
    if (existingEnrollment)
      throw new BadRequestException("Student already enrolled");

    return await this.prisma.$transaction(async (tx) => {
      // Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          offeringId,
          status: "active",
          enrollDate: new Date(),
          createdBy: staffUser.id,
          classRatio,
        },
      });

      // Create skips if any
      let sessionIds: string[] = [];
      if (skippedDates.length > 0) {
        const sessions = await tx.classSession.findMany({
          where: {
            offeringId,
            date: {
              in: skippedDates.map((d) => new Date(`${d}T00:00:00.000Z`)),
            },
          },
          select: { id: true, date: true },
        });

        if (sessions.length !== skippedDates.length) {
          throw new BadRequestException(
            "Some skipped dates don't have a class session associated with it"
          );
        }

        sessionIds = sessions.map((s) => s.id);

        await tx.enrollmentSkip.createMany({
          data: sessions.map((session) => ({
            enrollmentId: enrollment.id,
            classSessionId: session.id,
          })),
        });
      }

      // Create audit log for enrollment
      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Enroll Student",
          entityType: "Enrollment",
          entityId: enrollment.id,
          changes: {
            status: { from: null, to: "active" },
          },
          metadata: {
            studentId: studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            offeringId: offeringId,
            skippedDates: skippedDates,
            skippedSessionIds: sessionIds,
            skipsCreated: skippedDates.length,
          },
        },
      });

      return {
        success: true,
        enrollmentId: enrollment.id,
        skipsCreated: skippedDates.length,
      };
    });
  }

  async deleteEnrollment(id: string, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete enrollment (cascade should handle skips/attendance if configured,
      // but let's assume we might need to be careful. For now, standard delete)
      await tx.enrollment.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Delete Enrollment",
          entityType: "Enrollment",
          entityId: id,
          changes: {
            status: { from: enrollment.status, to: null },
          },
          metadata: {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            offeringId: enrollment.offeringId,
          },
        },
      });
    });

    return { success: true };
  }
}
