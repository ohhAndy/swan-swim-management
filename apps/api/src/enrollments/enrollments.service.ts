import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollWithSkipInput } from "./dto/enrollment.dto";
import { TransferEnrollmentDto } from "./dto/transfer.dto";
import { UnInvoicedEnrollmentsQueryDto } from "./dto/uninvoiced-enrollments-query.dto";
import { Prisma } from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";
import { validateLocationAccess } from "../common/helpers/location-access.helper";
import { calculateEnrollmentTuition } from "@school/shared-types";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async updateRemarks(
    enrollmentId: string,
    body: { remarks: string },
    staffUser: RequestStaffUser,
  ) {

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

      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "Update Remarks",
        entityType: "Enrollment",
        entityId: updated.id,
        changes: {
          status: { from: currEnrollment.notes, to: updated.notes },
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
    staffUser: RequestStaffUser,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      return this.executeTransfer(tx, enrollmentId, dto, staffUser);
    });
  }

  private async executeTransfer(
    tx: Prisma.TransactionClient,
    enrollmentId: string,
    dto: TransferEnrollmentDto,
    staffUser: RequestStaffUser,
  ) {
    const { targetOfferingId, skippedSessionIds = [], transferNotes } = dto;

    const currEnrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        offering: {
          include: { term: true },
        },
        student: true,
        invoiceLineItem: true,
      },
    });
    if (!currEnrollment) throw new NotFoundException("Enrollment DNE");
    if (currEnrollment.status !== "active")
      throw new BadRequestException("Enrollment is not active!");

    const targetOffering = await tx.classOffering.findUnique({
      where: { id: targetOfferingId },
      include: { term: true },
    });

    if (!targetOffering)
      throw new NotFoundException("Target offering not found");
    if (targetOffering.termId !== currEnrollment.offering.termId) {
      throw new BadRequestException("Can only transfer within the same term");
    }

    const existingEnrollment = await tx.enrollment.findFirst({
      where: {
        offeringId: targetOfferingId,
        studentId: currEnrollment.studentId,
        status: "active",
      },
    });
    if (existingEnrollment)
      throw new BadRequestException(
        "Student is already actively enrolled in the target offering",
      );

    // Fetch sessions for both offerings to map them by index
    const [oldSessions, newSessions] = await Promise.all([
      tx.classSession.findMany({
        where: { offeringId: currEnrollment.offeringId },
        orderBy: { date: "asc" },
      }),
      tx.classSession.findMany({
        where: { offeringId: targetOfferingId },
        orderBy: { date: "asc" },
      }),
    ]);

    // Fetch existing attendance and skips in parallel
    const [oldAttendance, oldSkips] = await Promise.all([
      tx.attendance.findMany({
        where: { enrollmentId: enrollmentId },
      }),
      tx.enrollmentSkip.findMany({
        where: { enrollmentId: enrollmentId },
      }),
    ]);

    // Check if an inactive enrollment already exists at the target offering
    // (e.g. student was there before and was transferred away — reactivate it)
    const existingInactive = await tx.enrollment.findFirst({
      where: {
        offeringId: targetOfferingId,
        studentId: currEnrollment.studentId,
        status: { not: "active" },
      },
    });

    let newEnrollment: { id: string };

    if (existingInactive) {
      // Reactivate the old enrollment record instead of creating a duplicate
      newEnrollment = await tx.enrollment.update({
        where: { id: existingInactive.id },
        data: {
          status: "active",
          enrollDate: new Date(),
          transferredFromId: enrollmentId,
          transferredToId: null,
          transferredAt: null,
          transferNotes: null,
          classRatio: currEnrollment.classRatio,
        },
      });
      // Clear any old attendance and skips on the reactivated enrollment —
      // we'll recreate them fresh from the source enrollment below
      await tx.attendance.deleteMany({
        where: { enrollmentId: existingInactive.id },
      });
      await tx.enrollmentSkip.deleteMany({
        where: { enrollmentId: existingInactive.id },
      });
    } else {
      // Create a brand-new enrollment
      newEnrollment = await tx.enrollment.create({
        data: {
          studentId: currEnrollment.studentId,
          offeringId: targetOfferingId,
          status: "active",
          enrollDate: new Date(),
          transferredFromId: enrollmentId,
          createdBy: staffUser.id,
          classRatio: currEnrollment.classRatio,
        },
      });
    }

    // Map sessions and identify which new sessions should have attendance vs skips
    const attendanceToCreate: Prisma.AttendanceCreateManyInput[] = [];
    const finalSkippedSessionIds = new Set(skippedSessionIds);

    oldSessions.forEach((oldSession, index) => {
      const newSession = newSessions[index];
      if (!newSession) return;

      const att = oldAttendance.find(
        (a) => a.classSessionId === oldSession.id,
      );
      if (att) {
        // If we have attendance, transfer it and REMOVE from skips
        attendanceToCreate.push({
          enrollmentId: newEnrollment.id,
          classSessionId: newSession.id,
          status: att.status,
          notes: `[Transferred] ${att.notes || ""}`.trim(),
          markedBy: staffUser.id,
          markedAt: new Date(),
        });
        finalSkippedSessionIds.delete(newSession.id);
      } else {
        // If the old session was skipped, carry that skip over to the new session
        const wasSkipped = oldSkips.some(
          (sk) => sk.classSessionId === oldSession.id,
        );
        if (wasSkipped) {
          finalSkippedSessionIds.add(newSession.id);
        }
      }
    });

    // Create transferred attendance records
    if (attendanceToCreate.length > 0) {
      await tx.attendance.createMany({
        data: attendanceToCreate,
      });
    }

    // Create skips for new enrollment (only for those WITHOUT attendance)
    if (finalSkippedSessionIds.size > 0) {
      await tx.enrollmentSkip.createMany({
        data: Array.from(finalSkippedSessionIds).map((sessionId) => ({
          enrollmentId: newEnrollment.id,
          classSessionId: sessionId,
        })),
      });
    }

    if (existingInactive) {
      // We're reactivating a previous enrollment — the intermediate source enrollment
      // (the one we're transferring FROM) is now redundant, so delete it cleanly.
      // Must move any invoice line item first due to onDelete: Restrict.
      if (currEnrollment.invoiceLineItem) {
        await tx.invoiceLineItem.update({
          where: { id: currEnrollment.invoiceLineItem.id },
          data: { enrollmentId: newEnrollment.id },
        });
      }
      // Attendance and EnrollmentSkips cascade-delete automatically.
      await tx.enrollment.delete({ where: { id: enrollmentId } });
    } else {
      // Fresh transfer — mark the old enrollment as transferred and move its invoice.
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
      if (currEnrollment.invoiceLineItem) {
        await tx.invoiceLineItem.update({
          where: { id: currEnrollment.invoiceLineItem.id },
          data: { enrollmentId: newEnrollment.id },
        });
      }
    }

    // Create audit log for transfer
    await this.auditLogsService.create(
      {
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
      tx,
    );

    // Create audit log for new enrollment creation
    await this.auditLogsService.create(
      {
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
      tx,
    );

    return {
      success: true,
      oldEnrollmentId: enrollmentId,
      newEnrollmentId: newEnrollment.id,
    };
  }

  async enrollWithSkips(input: EnrollWithSkipInput, staffUser: RequestStaffUser) {
    const { studentId, offeringId, skippedDates, classRatio } = input;

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
            "Some skipped dates don't have a class session associated with it",
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
      await this.auditLogsService.create(
        {
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
        tx,
      );

      return {
        success: true,
        enrollmentId: enrollment.id,
        skipsCreated: skippedDates.length,
      };
    });
  }

  async updateReportCardStatus(
    enrollmentId: string,
    status: string,
    staffUser: RequestStaffUser,
  ) {

    const curr = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!curr) throw new NotFoundException("Enrollment not found");

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { reportCardStatus: status },
    });

    await this.auditLogsService.create({
      staffId: staffUser.id,
      action: "Update Report Card Status",
      entityType: "Enrollment",
      entityId: enrollmentId,
      changes: {
        status: { from: curr.reportCardStatus, to: status },
      },
    });

    return { success: true, status };
  }

  async updateSkips(
    enrollmentId: string,
    skippedSessionIds: string[],
    staffUser: RequestStaffUser,
  ) {

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        offering: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!enrollment) throw new NotFoundException("Enrollment not found");
    if (enrollment.status !== "active" && enrollment.status !== "inactive")
      throw new BadRequestException("Enrollment is not active or inactive");

    if (
      enrollment.status === "inactive" &&
      staffUser.role !== "admin" &&
      staffUser.role !== "super_admin"
    ) {
      throw new ForbiddenException(
        "Only admins can modify skips for inactive enrollments",
      );
    }

    // Verify all skippedSessionIds belong to the offering
    const offeringSessionIds = new Set(
      enrollment.offering.sessions.map((s) => s.id),
    );
    for (const id of skippedSessionIds) {
      if (!offeringSessionIds.has(id)) {
        throw new BadRequestException(
          `Session ${id} does not belong to this offering`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete existing skips
      await tx.enrollmentSkip.deleteMany({
        where: { enrollmentId },
      });

      // 2. Create new skips
      if (skippedSessionIds.length > 0) {
        await tx.enrollmentSkip.createMany({
          data: skippedSessionIds.map((sessionId) => ({
            enrollmentId,
            classSessionId: sessionId,
          })),
        });
      }

      // 3. Audit Log
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Update Enrollment Skips",
          entityType: "Enrollment",
          entityId: enrollmentId,
          changes: {},
          metadata: {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            offeringId: enrollment.offeringId,
            skippedSessionIds,
            count: skippedSessionIds.length,
          },
        },
        tx,
      );
    });

    return { success: true };
  }

  async deleteEnrollment(id: string, staffUser: RequestStaffUser) {
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

      await this.auditLogsService.create(
        {
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
        tx,
      );
    });

    return { success: true };
  }
  // Get un-invoiced enrollments with location access, pagination, and tuition calculation
  async getUnInvoicedEnrollments(
    query?: UnInvoicedEnrollmentsQueryDto,
    staffUser?: RequestStaffUser,
    locationId?: string,
  ) {
    const validatedLocationId = staffUser
      ? validateLocationAccess(staffUser, locationId)
      : locationId;
    const page = parseInt(query?.page ?? "") || 1;
    const limit = parseInt(query?.limit ?? "") || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      invoiceLineItem: null, // Not linked to any invoice
      status: { in: ["active", "inactive"] },
    };

    if (query?.guardianId) {
      where.student = {
        guardianId: query.guardianId,
      };
    }

    if (query?.termId) {
      where.offering = {
        termId: query.termId,
      };
    }

    const includeAllLocations = query?.includeAllLocations === "true";
    const isAdmin =
      staffUser && ["admin", "super_admin"].includes(staffUser.role);

    if (isAdmin) {
      // For Admins/Super Admins:
      // They see all locations by default (e.g. creating invoice workflow).
      // Only filter by location if an explicit locationId query param is provided.
      if (query?.locationId && query.locationId !== "all") {
        const locationFilter = { term: { locationId: query.locationId } };
        where.offering = where.offering
          ? { AND: [where.offering, locationFilter] }
          : locationFilter;
      }
    } else {
      // For Managers / Non-Admins:
      // Always location-specific.
      if (validatedLocationId && !includeAllLocations) {
        const locationFilter = { term: { locationId: validatedLocationId } };
        where.offering = where.offering
          ? { AND: [where.offering, locationFilter] }
          : locationFilter;
      } else if (staffUser) {
        const accessibleLocationIds = staffUser.accessibleLocations.map(
          (l: { id: string }) => l.id,
        );
        const locationFilter = {
          term: { locationId: { in: accessibleLocationIds } },
        };
        where.offering = where.offering
          ? { AND: [where.offering, locationFilter] }
          : locationFilter;
      }
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ student: { guardianId: "asc" } }, { createdAt: "desc" }],
        include: {
          student: {
            include: {
              guardian: true,
            },
          },
          offering: {
            include: {
              term: {
                include: {
                  location: true,
                },
              },
              sessions: {
                select: { id: true },
              },
            },
          },
          enrollmentSkips: true,
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    // Enrich with suggested tuition amounts using centralized calculation
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const totalSessions = enrollment.offering.sessions.length;
      const skippedSessions = enrollment.enrollmentSkips.length;
      return {
        ...enrollment,
        totalSessions,
        suggestedAmount: calculateEnrollmentTuition(
          enrollment.classRatio,
          totalSessions,
          skippedSessions,
        ),
      };
    });

    return {
      data: enrichedEnrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUninvoiced(
    query?: UnInvoicedEnrollmentsQueryDto,
    staffUser?: RequestStaffUser,
    locationId?: string,
  ) {
    return this.getUnInvoicedEnrollments(query, staffUser, locationId);
  }

  async bulkTransfer(
    transfers: {
      enrollmentId: string;
      targetOfferingId: string;
      transferNotes?: string;
    }[],
    staffUser: RequestStaffUser,
  ) {
    if (!transfers || transfers.length === 0) {
      return { succeeded: 0, results: [] };
    }

    return await this.prisma.$transaction(
      async (tx) => {
        const results = [];
        for (const t of transfers) {
          const result = await this.executeTransfer(
            tx,
            t.enrollmentId,
            {
              targetOfferingId: t.targetOfferingId,
              skippedSessionIds: [],
              transferNotes: t.transferNotes,
            },
            staffUser,
          );
          results.push(result);
        }

        return { succeeded: results.length, results };
      },
      { maxWait: 10000, timeout: 30000 },
    );
  }
}
