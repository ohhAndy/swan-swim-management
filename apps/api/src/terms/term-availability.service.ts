import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getRatioWeight } from "@school/shared-types";

@Injectable()
export class TermAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTermAvailability(termId: string, level?: string, weekday?: number) {
    // 1. Fetch all offerings + sessions + enrollments + makeups in bulk
    // This is a heavy query but necessary to compute accurate availability
    const offerings = await this.prisma.classOffering.findMany({
      where: {
        termId,
        ...(level
          ? {
              OR: [
                { title: { contains: level, mode: "insensitive" } },
                // If filtering by level, we might want to check the offering title usually
              ],
            }
          : {}),
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
              select: { id: true, classRatio: true },
              where: { status: { not: "cancelled" } },
            },
            trialBookings: {
              select: { id: true, status: true, classRatio: true },
            },
            enrollmentSkips: {
              select: { enrollmentId: true },
            },
            attendance: {
              where: { status: "excused" },
              select: { enrollmentId: true },
            },
          },
        },
        enrollments: {
          where: { status: "active" },
          select: {
            id: true,
            classRatio: true,
          },
        },
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    // 2. Process in-memory to find open slots
    // Calculate cutoff date (Yesterday in UTC to be safe for all timezones)
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 1);
    const cutoffDate = now.toISOString().split("T")[0];

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
      const baseCap = off.capacity;
      const instructorCount = off.instructors.length;

      // Dynamic rule: 2+ instructors -> min 5 slots
      const dynamicMin = instructorCount >= 2 ? 5 : 0;
      const effectiveCapacity = Math.max(baseCap, dynamicMin);

      for (const sess of off.sessions) {
        if (sess.status === "canceled") continue;
        if (sess.date.toISOString().split("T")[0] < cutoffDate) continue;

        // Calculate Usage
        let filled = 0;

        // Enrollments (exclude skips/excused)
        const skipSet = new Set(
          sess.enrollmentSkips.map((s) => s.enrollmentId),
        );
        const excusedSet = new Set(sess.attendance.map((a) => a.enrollmentId));

        for (const enr of off.enrollments) {
          if (skipSet.has(enr.id) || excusedSet.has(enr.id)) continue;
          filled += getRatioWeight(enr.classRatio);
        }

        // Add Makeups (Weighted)
        for (const m of sess.makeUps) {
          filled += getRatioWeight(m.classRatio);
        }

        // Add Trials (Weighted)
        for (const t of sess.trialBookings) {
          if (["scheduled", "attended"].includes(t.status)) {
            filled += getRatioWeight(t.classRatio);
          }
        }

        const openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));

        if (openSeats > 0) {
          availableSessions.push({
            date: sess.date.toISOString().split("T")[0], // YYYY-MM-DD (UTC)
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
          capacity: effectiveCapacity, // Return effective capacity
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
