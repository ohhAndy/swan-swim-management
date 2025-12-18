import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  countUsedSeatsForSession,
  hasTimeConflict,
} from "../sessions/sessions.helpers";

@Injectable()
export class MakeupsService {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleMakeUp(
    input: { studentId: string; classSessionId: string; notes?: string },
    user: any
  ) {
    const { studentId, classSessionId, notes } = input;

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if(!staffUser) return;

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.classSession.findUnique({
        where: { id: classSessionId },
        include: { offering: { select: { id: true, capacity: true } } },
      });
      if (!session) throw new BadRequestException("Session not found");

      const dup = await tx.makeUpBooking.findUnique({
        where: { studentId_classSessionId: { studentId, classSessionId } },
        select: { id: true },
      });
      if (dup) throw new BadRequestException("Already booked a makeup here!");

      if (await hasTimeConflict(tx, studentId, session.date)) {
        throw new BadRequestException("Has Time Conflict!");
      }

      const { expectedRegulars, makeUpCount } = await countUsedSeatsForSession(
        tx,
        session.offeringId,
        session.date
      );
      const used = expectedRegulars + makeUpCount;
      if (used >= session.offering.capacity)
        throw new BadRequestException("No seats left");

      const booking = await tx.makeUpBooking.create({
        data: {
          studentId,
          classSessionId,
          status: "scheduled",
          notes: notes ?? null,
          createdBy: staffUser?.id ?? null,
        },
        select: { id: true, status: true, student: true, classSession: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Schedule Makeup",
          entityType: "MakeUpBooking",
          entityId: booking.id,
          metadata: {
            studentFirstName: booking.student.firstName,
            studentLastName: booking.student.lastName,
            studentBirthDate: booking.student.birthdate,
            studentLevel: booking.student.level,
            date: booking.classSession.date,
          }
        },
      });

      return { makeUpId: booking.id, status: booking.status };
    });
  }
}
