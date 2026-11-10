import { Test, TestingModule } from "@nestjs/testing";
import {
  CronTasksService,
  getBusinessTodayUtcMidnight,
} from "./cron-tasks.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

describe("CronTasksService", () => {
  let service: CronTasksService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronTasksService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CronTasksService>(CronTasksService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("deactivateExpiredEnrollments", () => {
    it("should update expired active enrollments to inactive status", async () => {
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.deactivateExpiredEnrollments();

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(prismaMock.enrollment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
          }),
          data: {
            status: "inactive",
          },
        }),
      );
    });

    it("should log and propagate errors if Prisma update fails", async () => {
      prismaMock.enrollment.updateMany.mockRejectedValue(
        new Error("Database connection timeout"),
      );

      await expect(service.deactivateExpiredEnrollments()).rejects.toThrow(
        "Database connection timeout",
      );
    });
  });

  describe("getBusinessTodayUtcMidnight", () => {
    it("uses the Toronto calendar date, not the UTC date", () => {
      // 2026-11-10 02:00 UTC is still 2026-11-09 21:00 in Toronto (EST)
      const result = getBusinessTodayUtcMidnight(new Date("2026-11-10T02:00:00Z"));
      expect(result.toISOString()).toBe("2026-11-09T00:00:00.000Z");
    });

    it("returns midnight UTC of the same date during the Toronto day", () => {
      const result = getBusinessTodayUtcMidnight(new Date("2026-07-15T16:00:00Z"));
      expect(result.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    });

    it("is passed to the endDate filter (terms ending today stay active)", async () => {
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 0 });

      await service.deactivateExpiredEnrollments();

      const call = prismaMock.enrollment.updateMany.mock.calls[0][0];
      expect(call.where.offering.term.endDate.lt.toISOString()).toBe(
        getBusinessTodayUtcMidnight().toISOString(),
      );
    });
  });

  describe("onApplicationBootstrap", () => {
    const originalEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("runs a catch-up deactivation outside of tests", async () => {
      process.env.NODE_ENV = "production";
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 2 });

      service.onApplicationBootstrap();
      await new Promise((r) => setImmediate(r));

      expect(prismaMock.enrollment.updateMany).toHaveBeenCalledTimes(1);
    });

    it("does not crash startup when the catch-up fails", async () => {
      process.env.NODE_ENV = "production";
      prismaMock.enrollment.updateMany.mockRejectedValue(new Error("db down"));

      expect(() => service.onApplicationBootstrap()).not.toThrow();
      await new Promise((r) => setImmediate(r));
    });

    it("is skipped when NODE_ENV is test", () => {
      process.env.NODE_ENV = "test";
      service.onApplicationBootstrap();
      expect(prismaMock.enrollment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("handleDailyEnrollmentCleanup", () => {
    it("should call deactivateExpiredEnrollments and return count", async () => {
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.handleDailyEnrollmentCleanup();

      expect(result.count).toBe(3);
    });
  });
});
