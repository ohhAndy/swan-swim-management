import { Injectable, Logger } from "@nestjs/common";
import type { EnrollmentStatus, OfferingType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { validateLocationAccess } from "../common/helpers/location-access.helper";
import { RequestStaffUser } from "../auth/auth.types";
import {
  calculateClassUsage,
  calculateSessionUsage,
} from "../common/capacity";
import {
  getTorontoCalendarDate,
  getTorontoDateString,
} from "../common/date.utils";

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats(
    termId: string,
    staffUser: RequestStaffUser,
    locationId?: string,
  ) {
    try {
      const validatedLocationId = validateLocationAccess(staffUser, locationId);

      const offerings = await this.prisma.classOffering.findMany({
        where: { termId },
        include: {
          instructors: { where: { removedAt: null }, select: { id: true } },
          enrollments: {
            where: { status: { not: "transferred" } },
            select: { id: true, status: true, classRatio: true },
          },
        },
      });
      const lessons = offerings.filter((o) => o.type !== "swim_team");

      let totalCapacity = 0;
      let totalEnrollments = 0;
      for (const off of lessons) {
        const { filled, effectiveCapacity } = calculateClassUsage(
          off.enrollments.filter((e) => e.status === "active"),
          off.instructors.length,
          off.capacity,
          off.type,
        );
        totalCapacity += effectiveCapacity;
        totalEnrollments += filled;
      }

      const utilization = await this.getSeatUtilization(lessons);

      // 2. Students per Day (Active enrollments only)
      // Group by weekday
      const studentsPerDay = Array(7).fill(0);

      // We can iterate over offerings since we already fetched them with enrollment counts
      // However, if we want specific counts per day we can just sum up from the offerings
      offerings.forEach((off) => {
        // Use raw length for headcount, not weighted capacity
        studentsPerDay[off.weekday] += off.enrollments.length;
      });

      // 3. Levels Breakdown
      // We need to query students with active enrollments in this term
      // Fetch all enrollments (active and inactive) to count students and levels, excluding transferred
      const allEnrollments = await this.prisma.enrollment.findMany({
        where: {
          offering: { termId },
          status: { not: "transferred" },
        },
        include: {
          student: {
            select: { level: true },
          },
        },
      });

      const activeStudents = allEnrollments.filter(
        (e) => e.status === "active",
      ).length;
      const inactiveStudents = allEnrollments.filter(
        (e) => e.status === "inactive",
      ).length;

      const levels: Record<string, number> = {};
      allEnrollments.forEach((e) => {
        const lvl = e.student.level || "Unknown";
        levels[lvl] = (levels[lvl] || 0) + 1;
      });

      // 4. Action Items
      // Pending makeups
      const pendingMakeups = await this.prisma.makeUpBooking.count({
        where: {
          status: "requested",
          classSession: validatedLocationId
            ? {
                offering: { term: { locationId: validatedLocationId } },
              }
            : undefined,
        },
      });

      // Upcoming trials (next 7 days)

      const upcomingTrials = await this.prisma.trialBooking.count({
        where: {
          status: "scheduled",
          classSession: {
            date: {
              gte: getTorontoCalendarDate(1),
              lte: getTorontoCalendarDate(7),
            },
            ...(validatedLocationId
              ? { offering: { term: { locationId: validatedLocationId } } }
              : {}),
          },
        },
      });

      return {
        studentCount: activeStudents + inactiveStudents,
        capacity: {
          total: totalCapacity,
          filled: totalEnrollments,
          percentage: percent(totalEnrollments, totalCapacity),
        },
        utilization,
        studentsPerDay, // Index 0-6 (Sun-Sat)
        levels,
        actionItems: {
          pendingMakeups,
          upcomingTrials,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error calculating dashboard stats for term ${termId}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /** Seats used versus seats offered across the lessons held so far this term */
  private async getSeatUtilization(
    offerings: {
      id: string;
      type: OfferingType;
      capacity: number;
      instructors: { id: string }[];
      enrollments: {
        id: string;
        status: EnrollmentStatus;
        classRatio: string | null;
      }[];
    }[],
  ) {
    const today = new Date(`${getTorontoDateString()}T00:00:00.000Z`);
    const sessions = await this.prisma.classSession.findMany({
      where: {
        offeringId: { in: offerings.map((o) => o.id) },
        status: { not: "canceled" },
        date: { lte: today },
      },
      select: {
        offeringId: true,
        enrollmentSkips: { select: { enrollmentId: true } },
        attendance: { select: { enrollmentId: true, status: true } },
        makeUps: { select: { status: true, classRatio: true } },
        trialBookings: { select: { status: true, classRatio: true } },
      },
    });

    const offeringById = new Map(offerings.map((o) => [o.id, o]));
    let seatsOffered = 0;
    let seatsUsed = 0;
    for (const sess of sessions) {
      const off = offeringById.get(sess.offeringId);
      if (!off) continue;
      const skipped = new Set(sess.enrollmentSkips.map((s) => s.enrollmentId));
      const attendance = new Map(
        sess.attendance.map((a) => [a.enrollmentId, a.status]),
      );
      const { filled, effectiveCapacity } = calculateSessionUsage({
        baseCapacity: off.capacity,
        instructorCount: off.instructors.length,
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
      seatsOffered += effectiveCapacity;
      seatsUsed += Math.min(filled, effectiveCapacity);
    }

    return {
      sessions: sessions.length,
      seatsOffered,
      seatsUsed,
      emptySeats: seatsOffered - seatsUsed,
      percentage: percent(seatsUsed, seatsOffered),
    };
  }
}
