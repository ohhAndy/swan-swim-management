import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestStaffUser } from "../auth/auth.types";
import {
  PracticeCheckInInput,
  UpdateMakeupAttendanceInput,
  UpsertAttendanceInput,
} from "./dto/attendance.dto";

import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { TokensService } from "../tokens/tokens.service";

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private tokensService: TokensService,
  ) {}

  async upsert(data: UpsertAttendanceInput, staffUser: RequestStaffUser) {
    // Get existing attendance record if it exists
    const existing = await this.prisma.attendance.findUnique({
      where: {
        enrollmentId_classSessionId: {
          classSessionId: data.classSessionId,
          enrollmentId: data.enrollmentId,
        },
      },
    });

    if (!data.status) {
      // UNMARK: Delete the attendance record
      if (existing) {
        await this.prisma.attendance.delete({
          where: {
            enrollmentId_classSessionId: {
              classSessionId: data.classSessionId,
              enrollmentId: data.enrollmentId,
            },
          },
        });

        // Log the deletion
        await this.auditLogsService.create({
          staffId: staffUser.id,
          action: "Unmark Attendance",
          entityType: "Attendance",
          entityId: existing.id,
          changes: {
            status: { from: existing.status, to: null },
          },
          metadata: {
            enrollmentId: data.enrollmentId,
            classSessionId: data.classSessionId,
            notes: existing.notes,
            markedBy: existing.markedBy,
            markedAt: existing.markedAt?.toISOString(),
          },
        });
      }
    } else {
      // CREATE or UPDATE attendance
      let studentId: string | undefined = undefined;
      if (data.enrollmentId) {
        const enr = await this.prisma.enrollment.findUnique({
          where: { id: data.enrollmentId },
          select: { studentId: true },
        });
        studentId = enr?.studentId;
      }

      const attendance = await this.prisma.attendance.upsert({
        where: {
          enrollmentId_classSessionId: {
            classSessionId: data.classSessionId,
            enrollmentId: data.enrollmentId,
          },
        },
        update: {
          status: data.status,
          updatedAt: new Date(),
          updatedBy: staffUser?.id ?? null,
        },
        create: {
          classSessionId: data.classSessionId,
          enrollmentId: data.enrollmentId,
          studentId: studentId ?? null,
          status: data.status,
          notes: data.notes,
          markedAt: new Date(),
          markedBy: staffUser?.id ?? null,
        },
      });

      // Log the change
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: existing ? "Update Attendance" : "Mark Attendance",
        entityType: "Attendance",
        entityId: attendance.id,
        changes: existing
          ? {
              status: { from: existing.status, to: attendance.status },
              ...(existing.notes !== data.notes && {
                notes: { from: existing.notes, to: data.notes },
              }),
            }
          : {
              status: { from: null, to: attendance.status },
            },
        metadata: {
          enrollmentId: data.enrollmentId,
          classSessionId: data.classSessionId,
        },
      });
    }

    return { success: true };
  }

  async updateMakeup(
    data: UpdateMakeupAttendanceInput,
    staffUser: RequestStaffUser,
  ) {
    // Get existing make-up booking with session offering term
    const existing = await this.prisma.makeUpBooking.findUnique({
      where: { id: data.makeUpId },
      include: {
        classSession: {
          select: {
            offering: { select: { termId: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Make-up booking not found");
    }

    return this.prisma.$transaction(async (tx) => {
      let tokenTransferred = false;

      // If cancelling/deleting a booking that owns a token, reconcile with any active override in the term
      if (existing.tokenId && (!data.status || data.status === "cancelled")) {
        tokenTransferred =
          await this.tokensService.reconcileTokenOnCancellation(
            existing,
            staffUser,
            tx,
          );
      }

      if (!data.status) {
        // CANCEL/DELETE: Remove the make-up booking
        if (existing.tokenId) {
          // Detach from booking first
          await tx.makeUpBooking.update({
            where: { id: data.makeUpId },
            data: { tokenId: null },
          });

          // If not transferred to clear an override, restore token to available
          if (!tokenTransferred) {
            await tx.makeUpToken.update({
              where: { id: existing.tokenId },
              data: {
                status: "available",
                consumedAt: null,
              },
            });
          }
        }

        await tx.makeUpBooking.delete({
          where: { id: data.makeUpId },
        });

        // Log the deletion
        await this.auditLogsService.create(
          {
            staffId: staffUser.id,
            action: "Cancel Makeup",
            entityType: "MakeUpBooking",
            entityId: existing.id,
            changes: {
              status: { from: existing.status, to: null },
            },
            metadata: {
              studentId: existing.studentId,
              sessionId: existing.classSessionId,
              tokenReconciled: tokenTransferred,
              tokenRefunded:
                existing.tokenId && !tokenTransferred ? true : false,
            },
          },
          tx,
        );
      } else {
        // UPDATE status
        if (
          data.status === "cancelled" &&
          existing.tokenId &&
          !tokenTransferred
        ) {
          // Restore token to available
          await tx.makeUpToken.update({
            where: { id: existing.tokenId },
            data: {
              status: "available",
              consumedAt: null,
            },
          });
        }

        const shouldClearToken =
          tokenTransferred ||
          (data.status === "cancelled" && Boolean(existing.tokenId));

        const updated = await tx.makeUpBooking.update({
          where: { id: data.makeUpId },
          data: {
            status: data.status,
            ...(shouldClearToken ? { tokenId: null } : {}),
            updatedBy: staffUser?.id ?? null,
          },
        });

        // Log the change
        await this.auditLogsService.create(
          {
            staffId: staffUser.id,
            action: "Update Makeup Status",
            entityType: "MakeUpBooking",
            entityId: updated?.id ?? existing.id,
            changes: {
              status: {
                from: existing.status,
                to: updated?.status ?? data.status,
              },
            },
            metadata: {
              studentId: existing.studentId,
              sessionId: existing.classSessionId,
              tokenReconciled: tokenTransferred,
              tokenRefunded:
                data.status === "cancelled" &&
                existing.tokenId &&
                !tokenTransferred
                  ? true
                  : false,
            },
          },
          tx,
        );
      }

      return { success: true };
    });
  }

  private calculateMembershipDelinquency(lineItems: any[]) {
    // Collect distinct active/unpaid invoices (exclude paid, void, and refunded)
    const invoiceMap = new Map<string, any>();
    for (const li of lineItems) {
      if (
        li.invoice &&
        !["paid", "void", "refunded"].includes(li.invoice.status)
      ) {
        invoiceMap.set(li.invoice.id, li.invoice);
      }
    }

    let maxDaysOverdue = 0;
    let totalAmountDue = 0;

    for (const invoice of invoiceMap.values()) {
      const paidAmount = (invoice.payments || []).reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0,
      );
      const balance = Number(invoice.totalAmount) - paidAmount;
      if (balance > 0) {
        // If dueDate is present, measure against dueDate; otherwise use createdAt
        const dueDate = invoice.dueDate
          ? new Date(invoice.dueDate)
          : invoice.createdAt;
        const days = Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        if (days > maxDaysOverdue) maxDaysOverdue = days;
        totalAmountDue += balance;
      }
    }

    let paymentStatus: "PAID" | "OVERDUE_GRACE" | "LOCKED" = "PAID";
    if (maxDaysOverdue > 10) {
      paymentStatus = "LOCKED";
    } else if (maxDaysOverdue >= 1) {
      paymentStatus = "OVERDUE_GRACE";
    }

    return {
      paymentStatus,
      daysOverdue: maxDaysOverdue,
      amountDue: totalAmountDue,
    };
  }

  /**
   * Retrieves current checked-in roster and eligible squad swimmers for a practice session.
   */
  async getPracticeRoster(sessionId: string, _staffUser: RequestStaffUser) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        offering: {
          include: {
            term: true,
          },
        },
        attendance: {
          include: {
            student: true,
          },
          orderBy: { markedAt: "asc" },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");

    const locationId = session.offering.term?.locationId;
    const sessionDate = session.date;

    // Get all active memberships for this season term, location, and date range
    const memberships = await this.prisma.studentMembership.findMany({
      where: {
        status: "active",
        ...(session.offering.termId
          ? { seasonTermId: session.offering.termId }
          : {}),
        ...(locationId ? { allowedLocationIds: { has: locationId } } : {}),
        startDate: { lte: sessionDate },
        OR: [{ endDate: null }, { endDate: { gte: sessionDate } }],
      },
      include: {
        student: true,
        lineItems: {
          include: {
            invoice: {
              include: { payments: true },
            },
          },
        },
      },
      orderBy: { student: { lastName: "asc" } },
    });

    const checkedInStudentIds = new Set(
      session.attendance.map((a) => a.studentId),
    );

    const eligibleSwimmers = memberships
      .filter((m) => !checkedInStudentIds.has(m.studentId))
      .map((m) => {
        const delinquency = this.calculateMembershipDelinquency(m.lineItems);

        return {
          studentId: m.studentId,
          name: `${m.student.firstName} ${m.student.lastName}`,
          level: m.student.level,
          membershipId: m.id,
          paymentStatus: delinquency.paymentStatus,
          daysOverdue: delinquency.daysOverdue,
          amountDue: delinquency.amountDue,
        };
      });

    return {
      session: {
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        capacity: session.offering.capacity,
        title: session.offering.title,
      },
      checkedInCount: session.attendance.length,
      capacity: session.offering.capacity,
      checkedIn: session.attendance.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        name: a.student
          ? `${a.student.firstName} ${a.student.lastName}`
          : "Unknown",
        status: a.status,
        markedAt: a.markedAt,
        acknowledgedOverdue: a.acknowledgedOverdue,
      })),
      eligibleSwimmers,
    };
  }

  /**
   * One-tap deck-side practice check-in enforcing pool capacity and 10-day delinquency grace period.
   */
  async practiceCheckIn(
    data: PracticeCheckInInput,
    staffUser: RequestStaffUser,
  ) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: data.classSessionId },
      include: {
        offering: {
          include: { term: true },
        },
        attendance: true,
      },
    });
    if (!session) throw new NotFoundException("Session not found");

    // UNMARK / CANCEL CHECK-IN (explicitly null)
    if (data.status === null) {
      const existing = await this.prisma.attendance.findUnique({
        where: {
          studentId_classSessionId: {
            studentId: data.studentId,
            classSessionId: data.classSessionId,
          },
        },
      });

      if (existing) {
        await this.prisma.attendance.delete({
          where: { id: existing.id },
        });

        await this.auditLogsService.create({
          staffId: staffUser.id,
          action: "Unmark Practice Check-In",
          entityType: "Attendance",
          entityId: existing.id,
          changes: { status: { from: "present", to: null } },
        });
      }

      return { success: true, checkedIn: false };
    }

    // MARK PRESENT
    const locationId = session.offering.term?.locationId;
    const sessionDate = session.date;
    const membership = await this.prisma.studentMembership.findFirst({
      where: {
        studentId: data.studentId,
        status: "active",
        ...(session.offering.termId
          ? { seasonTermId: session.offering.termId }
          : {}),
        ...(locationId ? { allowedLocationIds: { has: locationId } } : {}),
        startDate: { lte: sessionDate },
        OR: [{ endDate: null }, { endDate: { gte: sessionDate } }],
      },
      include: {
        student: true,
        lineItems: {
          include: {
            invoice: {
              include: { payments: true },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new BadRequestException(
        "Student does not have an active membership eligible for this practice session location",
      );
    }

    // 1. Delinquency Check (10-Day Grace Period)
    const { daysOverdue, amountDue } = this.calculateMembershipDelinquency(
      membership.lineItems,
    );

    const isSupervisorOrAbove = [
      "super_admin",
      "admin",
      "manager",
      "supervisor",
    ].includes(staffUser.role);

    if (daysOverdue > 10) {
      if (!isSupervisorOrAbove) {
        throw new ForbiddenException(
          `Account is locked (${daysOverdue} days overdue, $${amountDue.toFixed(2)} due). Supervisor/Admin override required.`,
        );
      }
    } else if (daysOverdue >= 1) {
      if (!data.acknowledgeOverdue) {
        throw new BadRequestException({
          code: "PAYMENT_OVERDUE_ACKNOWLEDGMENT_REQUIRED",
          message: `Payment is overdue (${daysOverdue} days, $${amountDue.toFixed(2)} due). Staff acknowledgment required.`,
          daysOverdue,
          amountDue,
        });
      }
    }

    // 2. Capacity Check
    const sessionAttendance = session.attendance || [];
    const alreadyCheckedIn = sessionAttendance.some(
      (a) => a.studentId === data.studentId,
    );
    if (
      !alreadyCheckedIn &&
      sessionAttendance.length >= session.offering.capacity
    ) {
      throw new BadRequestException(
        `Pool capacity reached (${session.offering.capacity}/${session.offering.capacity}). Cannot admit more swimmers.`,
      );
    }

    const hasOverdueAcknowledgment = Boolean(
      data.acknowledgeOverdue || data.overrideDelinquency || daysOverdue > 0,
    );

    // 3. Upsert Attendance
    const attendance = await this.prisma.attendance.upsert({
      where: {
        studentId_classSessionId: {
          studentId: data.studentId,
          classSessionId: data.classSessionId,
        },
      },
      create: {
        classSessionId: data.classSessionId,
        studentId: data.studentId,
        membershipId: membership.id,
        status: "present",
        notes: data.notes,
        acknowledgedOverdue: hasOverdueAcknowledgment,
        markedBy: staffUser.id,
      },
      update: {
        status: "present",
        notes: data.notes,
        acknowledgedOverdue: hasOverdueAcknowledgment,
        updatedBy: staffUser.id,
      },
    });

    await this.auditLogsService.create({
      staffId: staffUser.id,
      action:
        daysOverdue > 10
          ? "Practice Check-In (Supervisor Override)"
          : "Practice Check-In",
      entityType: "Attendance",
      entityId: attendance.id,
      changes: { status: { from: null, to: "present" } },
      metadata: {
        studentId: data.studentId,
        studentName: `${membership.student.firstName} ${membership.student.lastName}`,
        sessionId: data.classSessionId,
        acknowledgedOverdue: hasOverdueAcknowledgment,
        supervisorOverride: daysOverdue > 10,
        daysOverdue,
        amountDue,
      },
    });

    return {
      success: true,
      checkedIn: true,
      attendance,
    };
  }
}
