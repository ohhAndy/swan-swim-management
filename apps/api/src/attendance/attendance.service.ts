import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestStaffUser } from "../auth/auth.types";
import {
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
        tokenTransferred = await this.tokensService.reconcileTokenOnCancellation(
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
              tokenRefunded: existing.tokenId && !tokenTransferred ? true : false,
            },
          },
          tx,
        );
      } else {
        // UPDATE status
        if (data.status === "cancelled" && existing.tokenId && !tokenTransferred) {
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
              status: { from: existing.status, to: updated?.status ?? data.status },
            },
            metadata: {
              studentId: existing.studentId,
              sessionId: existing.classSessionId,
              tokenReconciled: tokenTransferred,
              tokenRefunded: data.status === "cancelled" && existing.tokenId && !tokenTransferred ? true : false,
            },
          },
          tx,
        );
      }

      return { success: true };
    });
  }
}
