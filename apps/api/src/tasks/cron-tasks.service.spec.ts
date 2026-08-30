import { Test, TestingModule } from "@nestjs/testing";
import { CronTasksService } from "./cron-tasks.service";
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

  describe("handleDailyEnrollmentCleanup", () => {
    it("should call deactivateExpiredEnrollments and return count", async () => {
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.handleDailyEnrollmentCleanup();

      expect(result.count).toBe(3);
    });
  });
});
