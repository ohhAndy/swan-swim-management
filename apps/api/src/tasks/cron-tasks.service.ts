import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

/** Business timezone used to decide which calendar day "today" is. */
const BUSINESS_TIME_ZONE = "America/Toronto";

/**
 * Returns midnight UTC of the current calendar date in the business timezone.
 *
 * `Term.endDate` is a `@db.Date` column, which Prisma materialises as midnight UTC
 * of that date. Comparing against midnight UTC of *today's Toronto date* makes the
 * check independent of the server's local timezone.
 */
export function getBusinessTodayUtcMidnight(now: Date = new Date()): Date {
  // en-CA formats as YYYY-MM-DD
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

@Injectable()
export class CronTasksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronTasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * The API host sleeps when idle, so the 04:00 cron below is frequently missed.
   * Run an idempotent catch-up on every boot (the host cold-starts at least daily)
   * without blocking application startup.
   */
  onApplicationBootstrap() {
    if (process.env.NODE_ENV === "test") return;

    void this.deactivateExpiredEnrollments()
      .then((result) =>
        this.logger.log(
          `Startup enrollment cleanup completed: ${result.count} enrollments deactivated.`,
        ),
      )
      .catch(() => {
        // Already logged inside deactivateExpiredEnrollments; never crash startup.
      });
  }

  /**
   * Automatically deactivates enrollments for terms that have ended.
   * Runs daily at 04:00 AM (Eastern Time / Toronto) when the process is awake.
   */
  @Cron("0 4 * * *", { timeZone: BUSINESS_TIME_ZONE })
  async handleDailyEnrollmentCleanup() {
    this.logger.log("Executing scheduled daily enrollment cleanup...");
    const result = await this.deactivateExpiredEnrollments();
    this.logger.log(`Scheduled daily enrollment cleanup completed: ${result.count} enrollments deactivated.`);
    return result;
  }

  /**
   * Core logic to mark active enrollments as inactive once their term's endDate
   * is strictly before today (Toronto calendar date).
   */
  async deactivateExpiredEnrollments() {
    try {
      const todayStart = getBusinessTodayUtcMidnight();

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
