import type { Prisma } from "@prisma/client";
import { calculateSessionUsage, type ClassUsage } from "./capacity";

export async function loadSessionUsage(
  db: Prisma.TransactionClient,
  classSessionId: string,
): Promise<ClassUsage | null> {
  const session = await db.classSession.findUnique({
    where: { id: classSessionId },
    select: {
      enrollmentSkips: { select: { enrollmentId: true } },
      attendance: { select: { enrollmentId: true, status: true } },
      makeUps: { select: { status: true, classRatio: true } },
      trialBookings: { select: { status: true, classRatio: true } },
      offering: {
        select: {
          type: true,
          capacity: true,
          instructors: { where: { removedAt: null }, select: { id: true } },
          enrollments: {
            where: { status: "active" },
            select: { id: true, status: true, classRatio: true },
          },
        },
      },
    },
  });
  if (!session) return null;

  const skipped = new Set(session.enrollmentSkips.map((s) => s.enrollmentId));
  const attendance = new Map(
    session.attendance.map((a) => [a.enrollmentId, a.status]),
  );

  return calculateSessionUsage({
    baseCapacity: session.offering.capacity,
    instructorCount: session.offering.instructors.length,
    offeringType: session.offering.type,
    enrollments: session.offering.enrollments.map((e) => ({
      status: e.status,
      classRatio: e.classRatio,
      skipped: skipped.has(e.id),
      attendanceStatus: attendance.get(e.id) ?? null,
    })),
    makeups: session.makeUps,
    trials: session.trialBookings,
  });
}

/** A staff-facing warning when a session holds more than its capacity */
export function overCapacityWarning(usage: ClassUsage | null): string | null {
  if (!usage || usage.filled <= usage.effectiveCapacity) return null;
  return `This class is now over capacity (${usage.filled}/${usage.effectiveCapacity} seats).`;
}
