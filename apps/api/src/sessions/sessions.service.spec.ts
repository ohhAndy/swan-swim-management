import { Test, TestingModule } from "@nestjs/testing";
import { SessionsService } from "./sessions.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

describe("SessionsService", () => {
  let service: SessionsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("seatsForSlot", () => {
    it("should return empty array if no offerings found", async () => {
      prismaMock.classOffering.findMany.mockResolvedValue([]);
      
      const result = await service.seatsForSlot({
        termId: "t1", weekday: 1, startTime: "10:00", dateOnly: "2024-01-01"
      });
      
      expect(result).toEqual([]);
    });

    it("should correctly calculate filled and empty seats considering skips and excused", async () => {
      prismaMock.classOffering.findMany.mockResolvedValue([{
        id: "off1", title: "Offering 1", capacity: 4, instructors: [{ id: "inst1" }]
      }]);
      prismaMock.classSession.findMany.mockResolvedValue([{ id: "sess1", offeringId: "off1" }]);
      
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: "enr1", offeringId: "off1", classRatio: "3:1", student: { id: "s1", firstName: "A", lastName: "B" } }, // active
        { id: "enr2", offeringId: "off1", classRatio: "3:1", student: { id: "s2", firstName: "C", lastName: "D" } }, // skipped
        { id: "enr3", offeringId: "off1", classRatio: "3:1", student: { id: "s3", firstName: "E", lastName: "F" } }  // excused
      ]);

      prismaMock.makeUpBooking.findMany.mockResolvedValue([
        { classSessionId: "sess1", student: { id: "s4", firstName: "G", lastName: "H" } }
      ]);

      prismaMock.enrollmentSkip.findMany.mockResolvedValue([{ classSessionId: "sess1", enrollmentId: "enr2" }]);
      prismaMock.attendance.findMany.mockResolvedValue([{ classSessionId: "sess1", enrollmentId: "enr3" }]);

      // Capacity should be 4 (base) since 1 instructor
      // Filled: enr1 (1 seat), s4 (1 makeup seat) = 2 seats filled
      // Open: 2

      const result = await service.seatsForSlot({
        termId: "t1", weekday: 1, startTime: "10:00", dateOnly: "2024-01-01"
      });

      expect(result).toHaveLength(1);
      const offering = result[0];
      expect(offering.capacity).toBe(4);
      expect(offering.seats).toHaveLength(4);
      expect(offering.seats[0].type).toBe("filled");
      expect(offering.seats[1].type).toBe("filled");
      expect(offering.seats[1]).toHaveProperty("makeup", true);
      expect(offering.seats[2].type).toBe("empty");
      expect(offering.seats[3].type).toBe("empty");
    });
  });
});
