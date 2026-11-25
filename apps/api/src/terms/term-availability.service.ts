import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { calculateSessionUsage, getEffectiveCapacity } from "../common/capacity";
import { getTorontoDateString } from "../common/date.utils";

@Injectable()
export class TermAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTermAvailability(termId: string, level?: string, weekday?: number) {
    // 1. Fetch all offerings + sessions + enrollments + makeups in bulk
    // This is a heavy query but necessary to compute accurate availability
    const offerings = await this.prisma.classOffering.findMany({
      where: {
        termId,
        ...(level ? { title: { contains: level, mode: "insensitive" } } : {}),
        ...(weekday !== undefined ? { weekday } : {}),
      },
      include: {
        instructors: {
          select: {
            id: true,
            instructor: { select: { firstName: true, lastName: true } },
          },
          where: { removedAt: null },
        },
        sessions: {
          orderBy: { date: "asc" },
          select: {
            id: true,
            date: true,
            status: true,
            makeUps: {
              select: { status: true, classRatio: true },
            },
            trialBookings: {
              select: { status: true, classRatio: true },
            },
            enrollmentSkips: {
              select: { enrollmentId: true },
            },
            attendance: {
              select: { enrollmentId: true, status: true },
            },
          },
        },
        enrollments: {
          where: { status: "active" },
          select: {
            id: true,
            status: true,
            classRatio: true,
          },
        },
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    // 2. Process in-memory to find open slots
    const today = getTorontoDateString();

    // Group by Weekday
    const byWeekday: Record<
      number,
      Array<{
        offeringId: string;
        title: string;
        time: string;
        capacity: number;
        sessions: Array<{
          date: string;
          openSeats: number;
        }>;
        instructors: string[];
      }>
    > = {};

    for (const off of offerings) {
      const availableSessions: Array<{ date: string; openSeats: number }> = [];
      const instructorCount = off.instructors.length;
      const capacity = getEffectiveCapacity(
        off.capacity,
        instructorCount,
        off.type,
      );

      for (const sess of off.sessions) {
        if (sess.status === "canceled") continue;
        const date = sess.date.toISOString().slice(0, 10);
        if (date < today) continue;

        const skipped = new Set(
          sess.enrollmentSkips.map((s) => s.enrollmentId),
        );
        const attendance = new Map(
          sess.attendance.map((a) => [a.enrollmentId, a.status]),
        );
        const { openSeats } = calculateSessionUsage({
          baseCapacity: off.capacity,
          instructorCount,
          offeringType: off.type,
          enrollments: off.enrollments.map((e) => ({
            status: e.status,
            classRatio: e.classRatio,
            skipped: skipped.has(e.id),
            attendanceStatus: attendance.get(e.id),
          })),
          makeups: sess.makeUps,
          trials: sess.trialBookings,
        });

        if (openSeats > 0) {
          availableSessions.push({
            date,
            openSeats,
          });
        }
      }

      if (availableSessions.length > 0) {
        const wd = off.weekday;
        if (!byWeekday[wd]) byWeekday[wd] = [];
        byWeekday[wd].push({
          offeringId: off.id,
          title: off.title,
          time: `${off.startTime}-${off.endTime}`,
          capacity,
          sessions: availableSessions,
          instructors: off.instructors
            .map((i) =>
              i.instructor
                ? `${i.instructor.firstName} ${i.instructor.lastName}`
                : "",
            )
            .filter(Boolean),
        });
      }
    }

    return byWeekday;
  }
}
