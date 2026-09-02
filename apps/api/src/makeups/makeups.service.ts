import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { validateLocationAccess } from "../common/helpers/location-access.helper";
import { countUsedSeatsForSession } from "../sessions/sessions.helpers";
import { RequestStaffUser } from "../auth/auth.types";
import { TokensService } from "../tokens/tokens.service";
import { ScheduleMakeUpInput } from "./dto/schedule-makeup.dto";

@Injectable()
export class MakeupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly tokensService: TokensService,
  ) {}

  async scheduleMakeUp(
    input: ScheduleMakeUpInput,
    staffUser: RequestStaffUser,
  ) {
    const { studentId, classSessionId, notes, overrideAcknowledged } = input;

    // Check student existence
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthdate: true,
        level: true,
      },
    });
    if (!student) throw new NotFoundException("Student not found");

    const session = await this.prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        offering: {
          select: {
            id: true,
            type: true,
            capacity: true,
            termId: true,
            term: { select: { id: true, name: true, locationId: true, endDate: true } },
          },
        },
      },
    });
    if (!session) throw new BadRequestException("Session not found");

    // Validate Location Access
    validateLocationAccess(
      staffUser,
      session.offering.term.locationId ?? undefined,
    );

    const dup = await this.prisma.makeUpBooking.findUnique({
      where: { studentId_classSessionId: { studentId, classSessionId } },
      select: { id: true },
    });
    if (dup) throw new BadRequestException("Already booked a makeup here!");

    const termId = session.offering.termId;

    // If staff hasn't acknowledged an override, check token balance before entering the transaction
    // This avoids reading outside the transaction after writes have occurred
    if (!overrideAcknowledged) {
      const tokenBalance = await this.tokensService.getTokenBalance(
        studentId,
        termId,
      );
      if (tokenBalance.available === 0) {
        return {
          requiresOverride: true,
          tokenBalance,
          studentName: `${student.firstName} ${student.lastName}`,
          termName: session.offering.term.name,
        };
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const { filled, effectiveCapacity } = await countUsedSeatsForSession(
          tx,
          session.offeringId,
          session.date,
        );

        if (filled + 1 > effectiveCapacity) {
          throw new BadRequestException("No seats left in this class session");
        }

        // Try consuming an available token for this student in this term
        const consumedToken = await this.tokensService.consumeAvailableToken(
          studentId,
          termId,
          tx,
        );

        const isOverride = !consumedToken;

        const booking = await tx.makeUpBooking.create({
          data: {
            studentId,
            classSessionId,
            status: "scheduled",
            notes: notes ?? null,
            createdBy: staffUser?.id ?? null,
            classRatio: input.classRatio ?? "3:1",
            tokenId: consumedToken ? consumedToken.id : null,
            isOverride,
          },
          select: { id: true, status: true, student: true, classSession: true },
        });

        await this.auditLogsService.create(
          {
            staffId: staffUser.id,
            action: isOverride ? "Schedule Makeup (Staff Override)" : "Schedule Makeup",
            entityType: "MakeUpBooking",
            entityId: booking.id,
            changes: {
              isOverride: { from: null, to: isOverride },
              tokenId: { from: null, to: consumedToken?.id ?? null },
            },
            metadata: {
              studentFirstName: booking.student.firstName,
              studentLastName: booking.student.lastName,
              studentBirthDate: booking.student.birthdate,
              studentLevel: booking.student.level,
              date: booking.classSession.date,
              termName: session.offering.term.name,
              isOverride,
              tokenId: consumedToken?.id ?? null,
            },
          },
          tx,
        );

        return {
          makeUpId: booking.id,
          status: booking.status,
          isOverride,
          tokenId: consumedToken?.id ?? null,
        };
      });
    } catch (error) {
      // Handle race condition: two concurrent requests pass the dup check but the DB unique constraint catches it
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Already booked a makeup here!");
      }
      throw error;
    }
  }
}
