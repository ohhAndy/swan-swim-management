import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";
import {
  CreateMembershipDto,
  UpdateMembershipDto,
  UninvoicedMembershipsQueryDto,
} from "./dto/membership.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateMembershipDto, staffUser: RequestStaffUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { guardian: true },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    const term = await this.prisma.term.findUnique({
      where: { id: dto.seasonTermId },
    });
    if (!term) {
      throw new NotFoundException(
        `Season Term with ID ${dto.seasonTermId} not found`,
      );
    }

    // Check if an active membership already exists for this season
    const existing = await this.prisma.studentMembership.findFirst({
      where: {
        studentId: dto.studentId,
        seasonTermId: dto.seasonTermId,
        status: "active",
      },
    });
    if (existing) {
      throw new BadRequestException(
        "Student already has an active membership for this season",
      );
    }

    const allowedLocations =
      dto.allowedLocationIds && dto.allowedLocationIds.length > 0
        ? dto.allowedLocationIds
        : term.locationId
        ? [term.locationId]
        : [];

    const membership = await this.prisma.studentMembership.create({
      data: {
        studentId: dto.studentId,
        seasonTermId: dto.seasonTermId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        annualRegFee: dto.annualRegFee,
        monthlyPracticeFee: dto.monthlyPracticeFee,
        annualRegPaid: false,
        allowedLocationIds: allowedLocations,
        notes: dto.notes,
        createdBy: staffUser.id,
      },
      include: {
        student: true,
        seasonTerm: true,
      },
    });

    await this.auditLogsService.create({
      staffId: staffUser.id,
      action: "Create Membership",
      entityType: "StudentMembership",
      entityId: membership.id,
      changes: {
        status: { from: null, to: "active" },
        monthlyPracticeFee: { from: null, to: dto.monthlyPracticeFee },
        annualRegFee: { from: null, to: dto.annualRegFee },
      },
      metadata: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        seasonTerm: term.name,
      },
    });

    return membership;
  }

  async findAll(query?: { status?: string; studentId?: string }) {
    const where: Prisma.StudentMembershipWhereInput = {};
    if (query?.status) {
      where.status = query.status as any;
    }
    if (query?.studentId) {
      where.studentId = query.studentId;
    }

    return this.prisma.studentMembership.findMany({
      where,
      include: {
        student: {
          include: { guardian: true },
        },
        seasonTerm: true,
        lineItems: {
          include: { invoice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const membership = await this.prisma.studentMembership.findUnique({
      where: { id },
      include: {
        student: {
          include: { guardian: true },
        },
        seasonTerm: true,
        lineItems: {
          include: { invoice: true },
        },
        attendances: {
          orderBy: { markedAt: "desc" },
          take: 20,
        },
      },
    });
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }
    return membership;
  }

  async update(
    id: string,
    dto: UpdateMembershipDto,
    staffUser: RequestStaffUser,
  ) {
    const existing = await this.findById(id);

    const updated = await this.prisma.studentMembership.update({
      where: { id },
      data: {
        status: dto.status,
        monthlyPracticeFee: dto.monthlyPracticeFee,
        annualRegFee: dto.annualRegFee,
        annualRegPaid: dto.annualRegPaid,
        allowedLocationIds: dto.allowedLocationIds,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
    });

    await this.auditLogsService.create({
      staffId: staffUser.id,
      action: "Update Membership",
      entityType: "StudentMembership",
      entityId: id,
      changes: {
        status: dto.status
          ? { from: existing.status, to: dto.status }
          : undefined,
        monthlyPracticeFee: dto.monthlyPracticeFee
          ? { from: existing.monthlyPracticeFee, to: dto.monthlyPracticeFee }
          : undefined,
      },
    });

    return updated;
  }

  /**
   * Discovers pending annual registration fees and monthly practice fees
   * to populate the manual invoice creation form. Supports multi-month billing.
   */
  async getUninvoiced(query: UninvoicedMembershipsQueryDto) {
    const targetMonth = query.month && query.month !== "all" ? query.month : null;

    const where: Prisma.StudentMembershipWhereInput = {
      status: "active",
    };

    if (query.guardianId) {
      where.student = { guardianId: query.guardianId };
    }

    if (query.locationId && query.locationId !== "all") {
      where.allowedLocationIds = { has: query.locationId };
    }

    const memberships = await this.prisma.studentMembership.findMany({
      where,
      include: {
        student: {
          include: { guardian: true },
        },
        seasonTerm: true,
        lineItems: {
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true, status: true },
            },
          },
        },
      },
    });

    const uninvoicedItems: {
      membershipId: string;
      studentId: string;
      studentName: string;
      guardianId: string;
      guardianName: string;
      feeType: "ANNUAL_REGISTRATION" | "MONTHLY_PRACTICE";
      billingPeriod: string;
      description: string;
      suggestedAmount: number;
    }[] = [];

    for (const mem of memberships) {
      const studentName = `${mem.student.firstName} ${mem.student.lastName}`;
      const guardianName = mem.student.guardian.fullName;

      // 1. Check Annual Registration Fee
      const hasAnnualInvoice = mem.lineItems.some(
        (li) =>
          li.feeType === "ANNUAL_REGISTRATION" &&
          (!li.invoice || li.invoice.status !== "void"),
      );
      if (!mem.annualRegPaid && !hasAnnualInvoice) {
        uninvoicedItems.push({
          membershipId: mem.id,
          studentId: mem.studentId,
          studentName,
          guardianId: mem.student.guardianId,
          guardianName,
          feeType: "ANNUAL_REGISTRATION",
          billingPeriod: `ANNUAL-${mem.seasonTerm.name}`,
          description: `${studentName} — Annual Registration Fee (${mem.seasonTerm.name})`,
          suggestedAmount: Number(mem.annualRegFee),
        });
      }

      // 2. Check Monthly Practice Fees
      let monthsToEvaluate: string[] = [];
      if (targetMonth) {
        monthsToEvaluate = [targetMonth];
      } else {
        // Generate list of months for the membership season
        const start = new Date(
          Date.UTC(
            mem.startDate.getUTCFullYear(),
            mem.startDate.getUTCMonth(),
            1,
          ),
        );
        const termEnd = mem.endDate ?? mem.seasonTerm.endDate;
        const end = termEnd
          ? new Date(
              Date.UTC(termEnd.getUTCFullYear(), termEnd.getUTCMonth(), 1),
            )
          : new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), 1));

        const curr = new Date(start.getTime());
        let count = 0;
        while (curr <= end && count < 12) {
          monthsToEvaluate.push(curr.toISOString().slice(0, 7));
          curr.setUTCMonth(curr.getUTCMonth() + 1);
          count++;
        }
      }

      for (const m of monthsToEvaluate) {
        const hasMonthlyInvoice = mem.lineItems.some(
          (li) =>
            li.feeType === "MONTHLY_PRACTICE" &&
            li.billingPeriod === m &&
            (!li.invoice || li.invoice.status !== "void"),
        );
        if (!hasMonthlyInvoice) {
          const [yearStr, monthNum] = m.split("-");
          const dateObj = new Date(
            Date.UTC(parseInt(yearStr, 10), parseInt(monthNum, 10) - 1, 1),
          );
          const monthLabel = dateObj.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          });

          uninvoicedItems.push({
            membershipId: mem.id,
            studentId: mem.studentId,
            studentName,
            guardianId: mem.student.guardianId,
            guardianName,
            feeType: "MONTHLY_PRACTICE",
            billingPeriod: m,
            description: `${studentName} — ${monthLabel} Monthly Practice Fee`,
            suggestedAmount: Number(mem.monthlyPracticeFee),
          });
        }
      }
    }

    return {
      month: targetMonth || new Date().toISOString().slice(0, 7),
      items: uninvoicedItems,
      totalCount: uninvoicedItems.length,
      hasActiveMemberships: memberships.length > 0,
    };
  }
}
