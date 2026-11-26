import { BadRequestException } from "@nestjs/common";
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
        accessibleLocations: [{ id: "loc1", slug: "loc-1" }],
      };

      // Mock slug uniqueness check
      prismaMock.term.findUnique.mockResolvedValue(null);

      const mockCreatedTerm = {
        id: "term1",
        name: "Winter 2024",
        slug: "winter-2024",
      };

      prismaMock.term.create.mockResolvedValue(mockCreatedTerm);
      // Echo the created offering back, as Prisma does, so it keeps its weekday
      prismaMock.classOffering.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          id: "off1",
          ...data,
        }),
      );
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
            },
          ],
        },
        mockStaffUser,
        { locationId: "loc1", accessibleIds: null },
      );

      expect(result).toEqual(mockCreatedTerm);
      // 8 weeks of Monday classes inside a 13-week term
      expect(prismaMock.classSession.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ offeringId: "off1" }),
        ]),
      });
      expect(
        prismaMock.classSession.createMany.mock.calls[0][0].data,
      ).toHaveLength(8);
      expect(prismaMock.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: "winter-2024",
            name: "Winter 2024",
          }),
        }),
      );
    });

    it("lets a super_admin create a term at any location", async () => {
      const superAdmin: RequestStaffUser = {
        id: "staff2",
        authId: "user2",
        email: "owner@test.com",
        fullName: "Owner",
        role: "super_admin",
        active: true,
        accessSchedule: null,
        accessibleLocations: [],
      };

      prismaMock.term.findUnique.mockResolvedValue(null);
      prismaMock.term.create.mockResolvedValue({ id: "term2" });

      await service.createTermWithSchedule(
        {
          name: "Spring 2024",
          startDate: new Date("2024-04-01"),
          endDate: new Date("2024-06-30"),
          weeks: 8,
          templates: [],
        },
        superAdmin,
        { locationId: "loc2", accessibleIds: null },
      );

      expect(prismaMock.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ locationId: "loc2" }),
        }),
      );
    });

    it("refuses to create a term with no location selected", async () => {
      const admin: RequestStaffUser = {
        id: "staff2",
        authId: "user2",
        email: "owner@test.com",
        fullName: "Owner",
        role: "admin",
        active: true,
        accessSchedule: null,
        accessibleLocations: [],
      };

      await expect(
        service.createTermWithSchedule(
          {
            name: "Spring 2024",
            startDate: new Date("2024-04-01"),
            endDate: new Date("2024-06-30"),
            weeks: 8,
            templates: [],
          },
          admin,
          { locationId: null, accessibleIds: null },
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.term.create).not.toHaveBeenCalled();
    });

    it("uses a manager's only location when none is selected", async () => {
      prismaMock.term.findUnique.mockResolvedValue(null);
      prismaMock.term.create.mockResolvedValue({ id: "term3" });

      await service.createTermWithSchedule(
        {
          name: "Summer 2024",
          startDate: new Date("2024-07-01"),
          endDate: new Date("2024-08-31"),
          weeks: 8,
          templates: [],
        },
        {
          id: "staff3",
          authId: "user3",
          email: "manager@test.com",
          fullName: "Manager",
          role: "manager",
          active: true,
          accessSchedule: null,
          accessibleLocations: [{ id: "loc1", slug: "loc-1" }],
        },
        { locationId: null, accessibleIds: ["loc1"] },
      );

      expect(prismaMock.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ locationId: "loc1" }),
        }),
      );
    });
  });

  describe("getAllTerms", () => {
    it("lists the selected location's terms", async () => {
      prismaMock.term.findMany.mockResolvedValue([
        { id: "t1", name: "Fall 2026", locationId: "loc1" },
      ]);

      const result = await service.getAllTerms({
        locationId: "loc1",
        accessibleIds: ["loc1", "loc2"],
      });
      expect(result).toEqual([
        { id: "t1", name: "Fall 2026", locationId: "loc1" },
      ]);
      expect(prismaMock.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { locationId: "loc1" } }),
      );
    });

    it("lists every accessible location's terms when none is selected", async () => {
      prismaMock.term.findMany.mockResolvedValue([]);

      await service.getAllTerms({
        locationId: null,
        accessibleIds: ["loc1", "loc2"],
      });
      expect(prismaMock.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { locationId: { in: ["loc1", "loc2"] } },
        }),
      );
    });
  });

  describe("getSlotsForWeekday", () => {
    it("should return distinct formatted time slots", async () => {
      prismaMock.classOffering.findMany.mockResolvedValue([
        { startTime: "16:00", endTime: "16:30" },
        { startTime: "16:30", endTime: "17:00" },
      ]);

      const result = await service.getSlotsForWeekday("term1", 1);
      expect(result).toEqual(["16:00-16:30", "16:30-17:00"]);
    });
  });
});
