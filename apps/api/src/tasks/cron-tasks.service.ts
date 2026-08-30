import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CronTasksService {
  private readonly logger = new Logger(CronTasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Automatically deactivates enrollments for terms that have ended.
   * Runs daily at 04:00 AM (Eastern Time / Toronto).
   */
  @Cron("0 4 * * *", { timeZone: "America/Toronto" })
  async handleDailyEnrollmentCleanup() {
    this.logger.log("Executing scheduled daily enrollment cleanup...");
    const result = await this.deactivateExpiredEnrollments();
    this.logger.log(`Scheduled daily enrollment cleanup completed: ${result.count} enrollments deactivated.`);
    return result;
  }

  /**
   * Core logic to mark active enrollments as inactive if their term endDate has passed.
   */
  async deactivateExpiredEnrollments() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const result = await this.prisma.enrollment.updateMany({
        where: {
          status: "active",
          offering: {
            term: {
              endDate: {
                lt: todayStart,
              },
            },
          },
        },
        data: {
          status: "inactive",
        },
      });

      return {
        success: true,
        count: result.count,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        "Failed to deactivate expired enrollments",
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
