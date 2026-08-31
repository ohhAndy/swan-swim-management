import { Test, TestingModule } from "@nestjs/testing";
import { TermScheduleService } from "./term-schedule.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("TermScheduleService", () => {
  let service: TermScheduleService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermScheduleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TermScheduleService>(TermScheduleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("slotByWeekdayAndTime - nextTermStatus filtering", () => {
    it("should filter future terms and next term enrollments to regular offerings only", async () => {
      prismaMock.term.findUnique.mockResolvedValue({
        id: "term1",
        name: "Term 1",
        startDate: new Date("2026-01-01"),
        locationId: "loc1",
      } as any);

      prismaMock.classOffering.findMany.mockResolvedValue([
        { id: "off1", capacity: 4, title: "Mon 4pm", termId: "term1", weekday: 1 },
      ] as any);

      prismaMock.classSession.findMany.mockResolvedValue([
        {
          id: "sess1",
          offeringId: "off1",
          date: new Date("2026-01-05"),
          startTime: "16:00",
          endTime: "16:45",
          status: "scheduled",
          offering: { instructors: [] },
        },
      ] as any);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: "enr1",
          studentId: "stud1",
          offeringId: "off1",
          status: "active",
          student: { id: "stud1", firstName: "Jane", lastName: "Doe" },
        },
      ] as any);

      prismaMock.attendance.findMany.mockResolvedValue([]);
      prismaMock.makeUpBooking.findMany.mockResolvedValue([]);
      prismaMock.trialBooking.findMany.mockResolvedValue([]);
      prismaMock.enrollmentSkip.findMany.mockResolvedValue([]);

      prismaMock.term.findMany.mockResolvedValue([
        { id: "term2", startDate: new Date("2026-04-01") },
      ] as any);

      await service.slotByWeekdayAndTime(1, "term1", "16:00", "16:45");

      expect(prismaMock.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            offerings: {
              some: {
                type: "regular",
              },
            },
          }),
        }),
      );

      expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            offering: {
              termId: { in: ["term2"] },
              type: "regular",
            },
          }),
        }),
      );
    });

    it("should throw BadRequestException if weekday is invalid", async () => {
      await expect(
        service.slotByWeekdayAndTime(7, "term1", "16:00", "16:45"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if term does not exist", async () => {
      prismaMock.term.findUnique.mockResolvedValue(null);
      prismaMock.classOffering.findMany.mockResolvedValue([]);

      await expect(
        service.slotByWeekdayAndTime(1, "term-invalid", "16:00", "16:45"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getFlexibleSlotPage", () => {
    it("should throw NotFoundException if term is not found", async () => {
      prismaMock.term.findUnique.mockResolvedValue(null);

      await expect(service.getFlexibleSlotPage("term-invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getDailySchedule", () => {
    it("should throw BadRequestException on invalid date format", async () => {
      await expect(
        service.getDailySchedule("loc1", "2026/01/01"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
