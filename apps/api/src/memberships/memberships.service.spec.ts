import { Test, TestingModule } from "@nestjs/testing";
import { MembershipsService } from "./memberships.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("MembershipsService", () => {
  let service: MembershipsService;
  let prismaMock: MockPrismaService;
  let auditLogsServiceMock: { create: jest.Mock };

  const mockStaffUser: RequestStaffUser = {
    id: "staff_1",
    authId: "user_1",
    email: "coach@swanswim.com",
    fullName: "Coach Dan",
    role: "manager",
    active: true,
    accessSchedule: {},
    accessibleLocations: [{ id: "loc_1" }],
  };

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    auditLogsServiceMock = { create: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        { provide: AuditLogsService, useValue: auditLogsServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should throw NotFoundException if student does not exist", async () => {
      prismaMock.student.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            studentId: "stu_999",
            seasonTermId: "term_1",
            startDate: "2026-09-01",
            annualRegFee: 150,
            monthlyPracticeFee: 220,
            allowedLocationIds: ["loc_1"],
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if season term does not exist", async () => {
      prismaMock.student.findUnique.mockResolvedValue({ id: "stu_1" });
      prismaMock.term.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            studentId: "stu_1",
            seasonTermId: "term_999",
            startDate: "2026-09-01",
            annualRegFee: 150,
            monthlyPracticeFee: 220,
            allowedLocationIds: ["loc_1"],
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if active membership already exists", async () => {
      prismaMock.student.findUnique.mockResolvedValue({ id: "stu_1" });
      prismaMock.term.findUnique.mockResolvedValue({ id: "term_1" });
      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_existing",
        status: "active",
      });

      await expect(
        service.create(
          {
            studentId: "stu_1",
            seasonTermId: "term_1",
            startDate: "2026-09-01",
            annualRegFee: 150,
            monthlyPracticeFee: 220,
            allowedLocationIds: ["loc_1"],
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create membership and log audit event", async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: "stu_1",
        firstName: "Emma",
        lastName: "Wilson",
      });
      prismaMock.term.findUnique.mockResolvedValue({
        id: "term_1",
        name: "2026-2027 Season",
      });
      prismaMock.studentMembership.findFirst.mockResolvedValue(null);
      const createdMem = {
        id: "mem_1",
        studentId: "stu_1",
        seasonTermId: "term_1",
        status: "active",
        annualRegPaid: false,
      };
      prismaMock.studentMembership.create.mockResolvedValue(createdMem);

      const result = await service.create(
        {
          studentId: "stu_1",
          seasonTermId: "term_1",
          startDate: "2026-09-01",
          annualRegFee: 150,
          monthlyPracticeFee: 220,
          allowedLocationIds: ["loc_1"],
        },
        mockStaffUser,
      );

      expect(result).toEqual(createdMem);
      expect(prismaMock.studentMembership.create).toHaveBeenCalled();
      expect(auditLogsServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "Create Membership",
          entityType: "StudentMembership",
          entityId: "mem_1",
        }),
      );
    });
  });

  describe("getUninvoiced", () => {
    it("should surface annual reg fee and target month practice fee when uninvoiced", async () => {
      prismaMock.studentMembership.findMany.mockResolvedValue([
        {
          id: "mem_1",
          studentId: "stu_1",
          annualRegFee: 150,
          monthlyPracticeFee: 220,
          annualRegPaid: false,
          allowedLocationIds: ["loc_1"],
          student: {
            firstName: "Emma",
            lastName: "Wilson",
            guardianId: "guard_1",
            guardian: { fullName: "Sarah Wilson" },
          },
          seasonTerm: { name: "2026-2027 Season" },
          lineItems: [],
        },
      ]);

      const res = await service.getUninvoiced({
        guardianId: "guard_1",
        month: "2026-10",
      });

      expect(res.hasActiveMemberships).toBe(true);
      expect(res.month).toBe("2026-10");
      expect(res.items).toHaveLength(2);

      const annual = res.items.find((i) => i.feeType === "ANNUAL_REGISTRATION");
      expect(annual).toBeDefined();
      expect(annual?.suggestedAmount).toBe(150);

      const monthly = res.items.find((i) => i.feeType === "MONTHLY_PRACTICE");
      expect(monthly).toBeDefined();
      expect(monthly?.suggestedAmount).toBe(220);
      expect(monthly?.billingPeriod).toBe("2026-10");
    });

    it("should omit annual fee if annualRegPaid = true, and omit monthly if already invoiced", async () => {
      prismaMock.studentMembership.findMany.mockResolvedValue([
        {
          id: "mem_1",
          studentId: "stu_1",
          annualRegFee: 150,
          monthlyPracticeFee: 220,
          annualRegPaid: true, // Already paid!
          allowedLocationIds: ["loc_1"],
          student: {
            firstName: "Emma",
            lastName: "Wilson",
            guardianId: "guard_1",
            guardian: { fullName: "Sarah Wilson" },
          },
          seasonTerm: { name: "2026-2027 Season" },
          lineItems: [
            {
              feeType: "MONTHLY_PRACTICE",
              billingPeriod: "2026-10", // October already invoiced!
            },
          ],
        },
      ]);

      // Query October -> should have 0 items
      const octRes = await service.getUninvoiced({
        guardianId: "guard_1",
        month: "2026-10",
      });

      expect(octRes.hasActiveMemberships).toBe(true);
      expect(octRes.items).toHaveLength(0);

      // Query November -> should have 1 item (November monthly practice fee)
      const novRes = await service.getUninvoiced({
        guardianId: "guard_1",
        month: "2026-11",
      });

      expect(novRes.hasActiveMemberships).toBe(true);
      expect(novRes.items).toHaveLength(1);
      expect(novRes.items[0].feeType).toBe("MONTHLY_PRACTICE");
      expect(novRes.items[0].billingPeriod).toBe("2026-11");
    });

    it("should return hasActiveMemberships = false if no memberships exist", async () => {
      prismaMock.studentMembership.findMany.mockResolvedValue([]);

      const res = await service.getUninvoiced({
        guardianId: "guard_regular_parent",
        month: "2026-10",
      });

      expect(res.hasActiveMemberships).toBe(false);
      expect(res.items).toHaveLength(0);
    });

    it("should discover all uninvoiced months in the season when month query is omitted", async () => {
      prismaMock.studentMembership.findMany.mockResolvedValue([
        {
          id: "mem_1",
          studentId: "stu_1",
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-12-31"),
          annualRegFee: 150,
          monthlyPracticeFee: 220,
          annualRegPaid: false,
          allowedLocationIds: ["loc_1"],
          student: {
            firstName: "Emma",
            lastName: "Wilson",
            guardianId: "guard_1",
            guardian: { fullName: "Sarah Wilson" },
          },
          seasonTerm: {
            name: "2026-2027 Season",
            endDate: new Date("2027-08-31"),
          },
          lineItems: [
            {
              feeType: "MONTHLY_PRACTICE",
              billingPeriod: "2026-09", // Sept already invoiced!
            },
          ],
        },
      ]);

      const res = await service.getUninvoiced({
        guardianId: "guard_1",
      });

      expect(res.hasActiveMemberships).toBe(true);
      // Annual reg + Oct + Nov + Dec = 4 items
      expect(res.items).toHaveLength(4);

      const annual = res.items.find((i) => i.feeType === "ANNUAL_REGISTRATION");
      expect(annual).toBeDefined();

      const monthlyPeriods = res.items
        .filter((i) => i.feeType === "MONTHLY_PRACTICE")
        .map((i) => i.billingPeriod);
      expect(monthlyPeriods).toEqual(["2026-10", "2026-11", "2026-12"]);
    });
  });
});
