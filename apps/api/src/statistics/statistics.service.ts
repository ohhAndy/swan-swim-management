import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(termId: string) {
    if (!termId) {
      throw new Error("Term ID is required");
    }

    // 1. Enrollment Capacity
    // Fetch all offerings for the term
    const offerings = await this.prisma.classOffering.findMany({
      where: { termId },
      include: {
        enrollments: {
          where: { status: "active" },
          select: {
            classRatio: true,
          },
        },
      },
    });

    const totalCapacity = offerings.reduce((sum, off) => sum + off.capacity, 0);

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
        0
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
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: {
        offering: { termId },
        status: "active",
      },
      include: {
        student: {
          select: { level: true },
        },
      },
    });

    const levels: Record<string, number> = {};
    activeEnrollments.forEach((e) => {
      const lvl = e.student.level || "Unknown";
      levels[lvl] = (levels[lvl] || 0) + 1;
    });

    const activeStudents = activeEnrollments.length;

    // 4. Action Items
    // Pending makeups
    const pendingMakeups = await this.prisma.makeUpBooking.count({
      where: { status: "requested" },
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
        },
      },
    });

    return {
      activeStudents,
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
  }
}
