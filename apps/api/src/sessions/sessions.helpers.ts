import type { Prisma } from "@prisma/client";
import { NOTFOUND } from "dns";
import { calculateClassUsage } from "../common/capacity.utils";

export async function countUsedSeatsForSession(
  tx: Prisma.TransactionClient,
  offeringId: string,
  date: Date
) {
  const session = await tx.classSession.findFirst({
    where: { offeringId, date },
    select: { id: true },
  });

  // Get Offering details for dynamic capacity
  const offering = await tx.classOffering.findUnique({
    where: { id: offeringId },
    select: { capacity: true, instructors: { where: { removedAt: null } } },
  });

  const enrollments = await tx.enrollment.findMany({
    where: {
      offeringId,
      status: "active",
      enrollDate: { lte: date },
      OR: [{ endDate: null }, { endDate: { gte: date } }],
      ...(session
        ? {
            enrollmentSkips: {
              none: { classSessionId: session.id },
            },
            attendance: {
              none: {
                classSessionId: session.id,
                status: "excused",
              },
            },
          }
        : {}),
    },
    select: { classRatio: true },
  });

  const makeups = session
    ? await tx.makeUpBooking.findMany({
        where: {
          classSessionId: session.id,
          status: { in: ["scheduled", "attended"] as any },
        },
        select: { id: true },
      })
    : [];

  const { filled, effectiveCapacity, openSeats } = calculateClassUsage(
    [...enrollments, ...makeups.map(() => ({ classRatio: "3:1" }))],
    offering?.instructors.length ?? 0,
    offering?.capacity ?? 0
  );

  return {
    filled,
    effectiveCapacity,
    openSeats,
    sessionId: session?.id ?? null,
  };
}

export async function hasTimeConflict(
  tx: Prisma.TransactionClient,
  studentId: string,
  date: Date
) {
  const sameTimeSessions = await tx.classSession.findMany({
    where: { date },
    select: { id: true, offeringId: true },
  });

  if (sameTimeSessions.length === 0) return false;

  const sessionIds = sameTimeSessions.map((s) => s.id);
  const offeringIds = sameTimeSessions.map((s) => s.offeringId);

  const conflict = await tx.enrollment.count({
    where: {
      studentId,
      offeringId: { in: offeringIds },
      status: "active",
      enrollDate: { lte: date },
      OR: [{ endDate: null }, { endDate: { gte: date } }],
      enrollmentSkips: {
        none: {
          classSessionId: { in: sessionIds },
        },
      },
    },
  });

  return conflict > 0;
}
