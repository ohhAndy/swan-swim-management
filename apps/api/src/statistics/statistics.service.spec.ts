import { Test, TestingModule } from "@nestjs/testing";
import { StatisticsService } from "./statistics.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";

describe("StatisticsService", () => {
  let service: StatisticsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    const mockStaffUser: RequestStaffUser = {
      id: "staff1",
      authId: "user1",
      email: "test@test.com",
      fullName: "Test Staff",
      role: "admin",
      active: true,
      accessSchedule: {},
      accessibleLocations: [{ id: "loc1", slug: "loc-1" }],
    };

    it("should calculate weighted capacity and filled seats using class ratios", async () => {
      // Offering 1: Capacity 6, with one 1:1 (3 slots) and one 2:1 (1.5 slots) -> 4.5 filled
      // Offering 2: Capacity 3, with two 3:1 (1.0 each) -> 2.0 filled
      // Total Capacity: 9, Total Filled: 6.5, Percentage: 72%
      prismaMock.classOffering.findMany.mockResolvedValue([
        {
          id: "off-1",
          type: "regular",
          capacity: 6,
          weekday: 1,
          instructors: [{ id: "i1" }],
          enrollments: [
            { id: "e1", status: "active", classRatio: "1:1" },
            { id: "e2", status: "active", classRatio: "2:1" },
          ],
        },
        {
          id: "off-2",
          type: "regular",
          capacity: 3,
          weekday: 2,
          instructors: [{ id: "i2" }],
          enrollments: [
            { id: "e3", status: "active", classRatio: "3:1" },
            { id: "e4", status: "active", classRatio: "3:1" },
          ],
        },
        {
          id: "off-3",
          type: "swim_team",
          capacity: 20,
          weekday: 3,
          instructors: [],
          enrollments: [{ id: "e5", status: "active", classRatio: null }],
        },
      ]);

      prismaMock.classSession.findMany.mockResolvedValue([
        {
          offeringId: "off-2",
          enrollmentSkips: [],
          attendance: [{ enrollmentId: "e3", status: "absent" }],
          makeUps: [{ status: "attended", classRatio: "3:1" }],
          trialBookings: [{ status: "cancelled", classRatio: "3:1" }],
        },
      ]);

      prismaMock.enrollment.findMany.mockResolvedValue([
        { status: "active", student: { level: "Beginner" } },
        { status: "active", student: { level: "Intermediate" } },
        { status: "inactive", student: { level: "Beginner" } },
        { status: "active", student: { level: "Beginner" } },
      ]);

      prismaMock.makeUpBooking.count.mockResolvedValue(2);
      prismaMock.trialBooking.count.mockResolvedValue(1);

      const stats = await service.getDashboardStats("term-123", {
        locationId: null,
        accessibleIds: ["loc1"],
      });

      expect(stats.capacity.total).toBe(9);
      expect(stats.capacity.filled).toBe(6.5);
      expect(stats.capacity.percentage).toBe(72); // Math.round((6.5 / 9) * 100)
      expect(stats.utilization).toEqual({
        sessions: 1,
        seatsOffered: 3,
        seatsUsed: 2,
        emptySeats: 1,
        percentage: 67,
      });
      expect(stats.studentCount).toBe(4);
      expect(stats.levels["Beginner"]).toBe(3);
      expect(stats.levels["Intermediate"]).toBe(1);
      expect(stats.actionItems.pendingMakeups).toBe(2);
      expect(stats.actionItems.upcomingTrials).toBe(1);
    });
  });
});
