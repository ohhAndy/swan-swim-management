import { Test, TestingModule } from "@nestjs/testing";
import { TermsService } from "./terms.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";

describe("TermsService", () => {
  let service: TermsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        AuditLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTermWithSchedule", () => {
    it("should create a term and generate a unique slug", async () => {
      const mockStaffUser: RequestStaffUser = {
        id: "staff1",
        authId: "user1",
        email: "test@test.com",
        fullName: "Test Staff",
        role: "admin",
        active: true,
        accessSchedule: {},
        accessibleLocations: [{ id: "loc1" }],
      };

      // Mock slug uniqueness check
      prismaMock.term.findUnique.mockResolvedValue(null); 

      const mockCreatedTerm = {
        id: "term1",
        name: "Winter 2024",
        slug: "winter-2024",
      };

      prismaMock.term.create.mockResolvedValue(mockCreatedTerm as any);
      prismaMock.classOffering.create.mockResolvedValue({ id: "off1" } as any);
      prismaMock.classSession.createMany.mockResolvedValue({ count: 8 });

      const result = await service.createTermWithSchedule(
        {
          name: "Winter 2024",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-03-31"),
          weeks: 8,
          templates: [
            {
              title: "Mon Class",
              weekday: 1,
              startTime: "16:00",
              duration: 30,
              capacity: 4,
            }
          ]
        },
        mockStaffUser,
        "loc1"
      );

      expect(result).toEqual(mockCreatedTerm.id);
      expect(prismaMock.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "winter-2024",
            name: "Winter 2024"
          }),
        }),
      );
    });
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
  });
});

