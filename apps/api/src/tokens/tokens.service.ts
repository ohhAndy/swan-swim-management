import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";
import { Prisma } from "@prisma/client";
import { GrantExtraTokensInput } from "./dto/grant-tokens.dto";
import { VoidTokenInput } from "./dto/void-token.dto";

@Injectable()
export class TokensService {
  /** Number of makeup tokens auto-granted per enrollment */
  static readonly DEFAULT_TOKENS_PER_ENROLLMENT = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Auto-grant 2 tokens on enrollment creation
   */
  async autoGrantTokens(
    enrollmentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const tokens = await Promise.all(
      Array.from(
        { length: TokensService.DEFAULT_TOKENS_PER_ENROLLMENT },
        () =>
          client.makeUpToken.create({
            data: {
              enrollmentId,
              status: "available",
              notes: "Initial enrollment grant",
            },
          }),
      ),
    );
    return tokens;
  }

  /**
   * Manually grant extra tokens to an enrollment
   */
  async grantExtraTokens(
    input: GrantExtraTokensInput,
    staffUser: RequestStaffUser,
  ) {
    const { enrollmentId, count, notes } = input;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        offering: {
          select: {
            title: true,
            term: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const createdTokens = await this.prisma.$transaction(async (tx) => {
      const tokens = [];
      for (let i = 0; i < count; i++) {
        const token = await tx.makeUpToken.create({
          data: {
            enrollmentId,
            status: "available",
            grantedBy: staffUser.id,
            notes,
          },
        });
        tokens.push(token);
      }

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Grant Extra Makeup Tokens",
          entityType: "MakeUpToken",
          entityId: enrollmentId,
          changes: {
            count: { from: 0, to: count },
          },
          metadata: {
            studentId: enrollment.student.id,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            termName: enrollment.offering.term.name,
            classTitle: enrollment.offering.title,
            notes,
            tokenIds: tokens.map((t) => t.id),
          },
        },
        tx,
      );

      return tokens;
    });

    return createdTokens;
  }

  /**
   * Void a token
   */
  async voidToken(
    tokenId: string,
    input: VoidTokenInput,
    staffUser: RequestStaffUser,
  ) {
    const existing = await this.prisma.makeUpToken.findUnique({
      where: { id: tokenId },
      include: {
        enrollment: {
          include: {
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Token not found");
    }

    if (existing.status === "consumed") {
      throw new BadRequestException("Cannot void a consumed token");
    }

    if (existing.status === "voided") {
      throw new BadRequestException("Token is already voided");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const token = await tx.makeUpToken.update({
        where: { id: tokenId },
        data: {
          status: "voided",
          notes: input.notes,
        },
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Void Makeup Token",
          entityType: "MakeUpToken",
          entityId: tokenId,
          changes: {
            status: { from: existing.status, to: "voided" },
          },
          metadata: {
            enrollmentId: existing.enrollmentId,
            studentName: `${existing.enrollment.student.firstName} ${existing.enrollment.student.lastName}`,
            notes: input.notes,
          },
        },
        tx,
      );

      return token;
    });

    return updated;
  }

  /**
   * Get token balance for a student, optionally filtered by termId
   */
  async getTokenBalance(studentId: string, termId?: string) {
    const now = new Date();

    // Find all relevant enrollments for the student
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        ...(termId ? { offering: { termId } } : {}),
      },
      include: {
        offering: {
          include: {
            term: {
              select: { id: true, name: true, endDate: true },
            },
          },
        },
        makeUpTokens: {
          orderBy: { grantedAt: "asc" },
        },
      },
    });

    let total = 0;
    let available = 0;
    let consumed = 0;
    let expired = 0;
    let voided = 0;

    for (const enr of enrollments) {
      const termEndDate = enr.offering.term.endDate;
      const isTermEnded = termEndDate ? new Date(termEndDate) < now : false;

      for (const token of enr.makeUpTokens) {
        total++;
        if (token.status === "consumed") {
          consumed++;
        } else if (token.status === "voided") {
          voided++;
        } else if (token.status === "available") {
          if (isTermEnded) {
            expired++;
          } else {
            available++;
          }
        }
      }
    }

    // Count active non-cancelled overrides for this student (and term if provided)
    const overrideCount = await this.prisma.makeUpBooking.count({
      where: {
        studentId,
        isOverride: true,
        status: { notIn: ["cancelled"] },
        ...(termId ? { classSession: { offering: { termId } } } : {}),
      },
    });

    return {
      total,
      available,
      consumed,
      expired,
      voided,
      overrideCount,
    };
  }

  /**
   * Get grouped token summaries per term for a student
   */
  async getStudentTokenSummaries(studentId: string) {
    const now = new Date();

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        offering: {
          include: {
            term: {
              select: { id: true, name: true, startDate: true, endDate: true },
            },
          },
        },
        makeUpTokens: {
          include: {
            grantedByUser: { select: { fullName: true } },
          },
          orderBy: { grantedAt: "asc" },
        },
      },
      orderBy: { enrollDate: "desc" },
    });

    // Group enrollments by term
    const termMap = new Map<
      string,
      {
        termId: string;
        termName: string;
        startDate: Date;
        endDate: Date;
        total: number;
        available: number;
        consumed: number;
        expired: number;
        voided: number;
        tokens: Array<{
          id: string;
          enrollmentId: string;
          status: "available" | "consumed" | "expired" | "voided";
          grantedAt: string;
          consumedAt: string | null;
          grantedBy: string | null;
          notes: string | null;
          isAutoGranted: boolean;
        }>;
      }
    >();

    for (const enr of enrollments) {
      const term = enr.offering.term;
      if (!term) continue;

      if (!termMap.has(term.id)) {
        termMap.set(term.id, {
          termId: term.id,
          termName: term.name,
          startDate: term.startDate,
          endDate: term.endDate,
          total: 0,
          available: 0,
          consumed: 0,
          expired: 0,
          voided: 0,
          tokens: [],
        });
      }

      const termSummary = termMap.get(term.id)!;
      const isTermEnded = term.endDate ? new Date(term.endDate) < now : false;

      for (const token of enr.makeUpTokens) {
        termSummary.total++;
        let effectiveStatus: "available" | "consumed" | "expired" | "voided" =
          token.status;

        if (token.status === "consumed") {
          termSummary.consumed++;
        } else if (token.status === "voided") {
          termSummary.voided++;
        } else if (token.status === "available") {
          if (isTermEnded) {
            effectiveStatus = "expired";
            termSummary.expired++;
          } else {
            termSummary.available++;
          }
        }

        termSummary.tokens.push({
          id: token.id,
          enrollmentId: token.enrollmentId,
          status: effectiveStatus,
          grantedAt: token.grantedAt.toISOString(),
          consumedAt: token.consumedAt?.toISOString() ?? null,
          grantedBy: token.grantedByUser?.fullName ?? null,
          notes: token.notes,
          isAutoGranted: token.grantedBy === null,
        });
      }
    }

    // Get active overrides grouped by term (excluding cancelled)
    const overrideBookings = await this.prisma.makeUpBooking.findMany({
      where: {
        studentId,
        isOverride: true,
        status: { notIn: ["cancelled"] },
      },
      select: {
        id: true,
        classSession: {
          select: {
            offering: { select: { termId: true } },
          },
        },
      },
    });

    const overridesByTerm = new Map<string, number>();
    for (const ob of overrideBookings) {
      const tId = ob.classSession.offering.termId;
      if (tId) {
        overridesByTerm.set(tId, (overridesByTerm.get(tId) || 0) + 1);
      }
    }

    // Sort terms newest first
    const result = Array.from(termMap.values())
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map((t) => ({
        termId: t.termId,
        termName: t.termName,
        total: t.total,
        available: t.available,
        consumed: t.consumed,
        expired: t.expired,
        voided: t.voided,
        overrideCount: overridesByTerm.get(t.termId) || 0,
        tokens: t.tokens,
      }));

    return result;
  }

  /**
   * Find and consume an available token for a student within a term
   */
  async consumeAvailableToken(
    studentId: string,
    termId: string,
    tx: Prisma.TransactionClient,
  ) {
    const now = new Date();

    // Find active enrollments for this student in this term
    const enrollments = await tx.enrollment.findMany({
      where: {
        studentId,
        offering: { termId },
      },
      include: {
        offering: {
          include: {
            term: { select: { endDate: true } },
          },
        },
        makeUpTokens: {
          where: { status: "available" },
          orderBy: { grantedAt: "asc" },
        },
      },
    });

    for (const enr of enrollments) {
      const isTermEnded = enr.offering.term.endDate
        ? new Date(enr.offering.term.endDate) < now
        : false;

      if (!isTermEnded && enr.makeUpTokens.length > 0) {
        const tokenToConsume = enr.makeUpTokens[0];
        const consumed = await tx.makeUpToken.update({
          where: { id: tokenToConsume.id },
          data: {
            status: "consumed",
            consumedAt: new Date(),
          },
        });
        return consumed;
      }
    }

    return null;
  }

  /**
   * Reconcile tokens upon makeup cancellation.
   * If a makeup with a token is cancelled or deleted, and the student has an active
   * override booking in the same term, transfer the token to that override booking
   * and clear the override flag (isOverride = false).
   */
  async reconcileTokenOnCancellation(
    cancelledBooking: {
      id: string;
      studentId: string;
      tokenId: string | null;
      classSession: { offering: { termId: string } };
    },
    staffUser: RequestStaffUser,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const termId = cancelledBooking.classSession?.offering?.termId;
    if (!termId || !cancelledBooking.tokenId) return false;

    // Find the earliest active override booking for this student in this term
    const activeOverride = await tx.makeUpBooking.findFirst({
      where: {
        studentId: cancelledBooking.studentId,
        id: { not: cancelledBooking.id },
        isOverride: true,
        status: { notIn: ["cancelled"] },
        classSession: { offering: { termId } },
      },
      orderBy: { createdAt: "asc" },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    if (!activeOverride) return false;

    // Transfer the token to the override booking and clear isOverride
    await tx.makeUpBooking.update({
      where: { id: activeOverride.id },
      data: {
        tokenId: cancelledBooking.tokenId,
        isOverride: false,
      },
    });

    await this.auditLogsService.create(
      {
        staffId: staffUser.id,
        action: "Reconcile Token (Override Cleared)",
        entityType: "MakeUpBooking",
        entityId: activeOverride.id,
        changes: {
          isOverride: { from: true, to: false },
          tokenId: { from: null, to: cancelledBooking.tokenId },
        },
        metadata: {
          studentName: `${activeOverride.student.firstName} ${activeOverride.student.lastName}`,
          cancelledBookingId: cancelledBooking.id,
          reconciledBookingId: activeOverride.id,
          tokenId: cancelledBooking.tokenId,
          reason:
            "A prior makeup was cancelled; its token was transferred to clear an existing override booking",
        },
      },
      tx,
    );

    return true;
  }
}
