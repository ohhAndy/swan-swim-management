import { Test, TestingModule } from "@nestjs/testing";
import { TermAvailabilityService } from "./term-availability.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";

describe("TermAvailabilityService", () => {
  let service: TermAvailabilityService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermAvailabilityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TermAvailabilityService>(TermAvailabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTermAvailability", () => {
    it("should return open seats grouped by weekday", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      prismaMock.classOffering.findMany.mockResolvedValue([
        {
          id: "off1",
          termId: "term1",
          title: "Swimmer 1",
          weekday: 1,
          startTime: "16:00",
          endTime: "16:30",
          capacity: 4,
          instructors: [{ id: "inst1", instructor: { firstName: "John", lastName: "Doe" } }],
          sessions: [
            {
              id: "sess1",
              date: futureDate,
              status: "scheduled",
              makeUps: [],
              trialBookings: [],
              enrollmentSkips: [],
              attendance: [],
            },
          ],
          enrollments: [
            { id: "enr1", classRatio: "3:1" },
          ],
        },
      ] as any);

      const result = await service.getTermAvailability("term1");

      expect(result[1]).toBeDefined();
      expect(result[1].length).toBe(1);
      expect(result[1][0].offeringId).toBe("off1");
      expect(result[1][0].sessions[0].openSeats).toBe(3); // 4 cap - 1 filled (3:1 = 1 weight)
      expect(result[1][0].instructors).toEqual(["John Doe"]);
    });

    it("should account for ratio weighting when calculating open seats", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      prismaMock.classOffering.findMany.mockResolvedValue([
        {
          id: "off2",
          termId: "term1",
          title: "Private Lesson",
          weekday: 2,
          startTime: "17:00",
          endTime: "17:30",
          capacity: 3,
          instructors: [],
          sessions: [
            {
              id: "sess2",
              date: futureDate,
              status: "scheduled",
              makeUps: [],
              trialBookings: [],
              enrollmentSkips: [],
              attendance: [],
            },
          ],
          enrollments: [
            { id: "enr2", classRatio: "1:1" }, // Weight 3.0
          ],
        },
      ] as any);

      const result = await service.getTermAvailability("term1");

      // 3 cap - 3.0 filled = 0 open seats -> excluded from available sessions
      expect(result[2]).toBeUndefined();
    });
  });
});
