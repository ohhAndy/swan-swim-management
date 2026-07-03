import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { validateLocationAccess } from "../common/helpers/location-access.helper";
import { AuthenticatedUser } from "../auth/auth.types";

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats(
    termId: string,
    user: AuthenticatedUser,
    locationId?: string,
  ) {
    try {
      if (!termId) {
        throw new Error("Term ID is required");
      }

      const staffUser = await this.prisma.staffUser.findUnique({
        where: { authId: user.authId },
        include: { accessibleLocations: true },
      });

      if (!staffUser) {
        throw new Error("User not found");
      }

      const validatedLocationId = validateLocationAccess(staffUser, locationId);

      // 1. Enrollment Capacity
      // Fetch all offerings for the term
      const offerings = await this.prisma.classOffering.findMany({
        where: { termId },
        include: {
          enrollments: {
            where: { status: { not: "transferred" } },
            select: {
              classRatio: true,
            },
          },
        },
      });

      const totalCapacity = offerings.reduce(
        (sum, off) => sum + off.capacity,
        0,
      );

      const getEnrollmentWeight = (ratio: string) => {
        switch (ratio) {
          case "1:1":
            return 3;
          case "2:1":
            return 1.5;
          case "3:1":
          default:
            return 1;
        }
      };

      const totalEnrollments = offerings.reduce((sum, off) => {
        const offeringWeight = off.enrollments.reduce(
          (w, e) => w + getEnrollmentWeight(e.classRatio || "3:1"),
          0,
        );
        return sum + offeringWeight;
      }, 0);

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
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const upcomingTrials = await this.prisma.trialBooking.count({
        where: {
          status: "scheduled",
          classSession: {
            date: {
              gte: new Date(),
              lte: sevenDaysFromNow,
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
          percentage:
            totalCapacity > 0
              ? Math.round((totalEnrollments / totalCapacity) * 100)
              : 0,
        },
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
}
