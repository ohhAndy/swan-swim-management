import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceService } from "./attendance.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { TokensService } from "../tokens/tokens.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { Attendance, AttendanceStatus } from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";

describe("AttendanceService", () => {
  let service: AttendanceService;
  let prismaMock: MockPrismaService;
  let tokensServiceMock: Partial<TokensService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    tokensServiceMock = {
      reconcileTokenOnCancellation: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        AuditLogsService,
        { provide: TokensService, useValue: tokensServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("upsert", () => {
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

    it("should create/update attendance and log it", async () => {
      prismaMock.attendance.findUnique.mockResolvedValue(null);

      const mockAttendance = {
        id: "att1",
        enrollmentId: "enr1",
        classSessionId: "sess1",
        status: AttendanceStatus.present,
      };
      prismaMock.attendance.upsert.mockResolvedValue(mockAttendance as unknown as Attendance);

      const result = await service.upsert(
        {
          enrollmentId: "enr1",
          classSessionId: "sess1",
          status: AttendanceStatus.present,
        },
        mockStaffUser,
      );

      expect(result).toBeDefined();
      expect(prismaMock.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            status: AttendanceStatus.present,
          }),
        }),
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should delete attendance record if status is empty string", async () => {
      prismaMock.attendance.findUnique.mockResolvedValue({
        enrollmentId: "enr1",
        classSessionId: "sess1",
        status: AttendanceStatus.absent,
      } as any);

      // Pass "" as status to trigger deletion logic
      const result = await service.upsert(
        {
          enrollmentId: "enr1",
          classSessionId: "sess1",
          status: "" as AttendanceStatus,
        },
        mockStaffUser,
      );

      expect(result).toEqual({ success: true });
      expect(prismaMock.attendance.delete).toHaveBeenCalledWith({
        where: {
          enrollmentId_classSessionId: {
            enrollmentId: "enr1",
            classSessionId: "sess1",
          },
        },
      });
    });
  });

  describe("updateMakeup", () => {
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

    it("should trigger reconcileTokenOnCancellation when cancelling makeup with a token", async () => {
      prismaMock.makeUpBooking.findUnique.mockResolvedValue({
        id: "mk1",
        studentId: "std1",
        tokenId: "tok1",
        classSessionId: "sess1",
        status: "scheduled",
        classSession: { offering: { termId: "term1" } },
      } as unknown as Awaited<ReturnType<typeof prismaMock.makeUpBooking.findUnique>>);

      const result = await service.updateMakeup(
        { makeUpId: "mk1", status: "cancelled" },
        mockStaffUser,
      );

      expect(result).toEqual({ success: true });
      expect(tokensServiceMock.reconcileTokenOnCancellation).toHaveBeenCalled();
    });

    it("should restore token to available when cancelled and no override absorbs it", async () => {
      tokensServiceMock.reconcileTokenOnCancellation = jest.fn().mockResolvedValue(false);

      prismaMock.makeUpBooking.findUnique.mockResolvedValue({
        id: "mk1",
        studentId: "std1",
        tokenId: "tok1",
        classSessionId: "sess1",
        status: "scheduled",
        classSession: { offering: { termId: "term1" } },
      } as unknown as Awaited<ReturnType<typeof prismaMock.makeUpBooking.findUnique>>);

      const result = await service.updateMakeup(
        { makeUpId: "mk1", status: "cancelled" },
        mockStaffUser,
      );

      expect(result).toEqual({ success: true });
      expect(prismaMock.makeUpToken.update).toHaveBeenCalledWith({
        where: { id: "tok1" },
        data: {
          status: "available",
          consumedAt: null,
        },
      });
    });

    it("should restore token to available when makeup booking is removed (deleted)", async () => {
      tokensServiceMock.reconcileTokenOnCancellation = jest.fn().mockResolvedValue(false);

      prismaMock.makeUpBooking.findUnique.mockResolvedValue({
        id: "mk1",
        studentId: "std1",
        tokenId: "tok1",
        classSessionId: "sess1",
        status: "scheduled",
        classSession: { offering: { termId: "term1" } },
      } as unknown as Awaited<ReturnType<typeof prismaMock.makeUpBooking.findUnique>>);

      const result = await service.updateMakeup(
        { makeUpId: "mk1", status: null },
        mockStaffUser,
      );

      expect(result).toEqual({ success: true });
      expect(prismaMock.makeUpToken.update).toHaveBeenCalledWith({
        where: { id: "tok1" },
        data: {
          status: "available",
          consumedAt: null,
        },
      });
      expect(prismaMock.makeUpBooking.delete).toHaveBeenCalledWith({
        where: { id: "mk1" },
      });
    });

    it("should not restore token when override absorbs it upon deletion", async () => {
      tokensServiceMock.reconcileTokenOnCancellation = jest.fn().mockResolvedValue(true);

      prismaMock.makeUpBooking.findUnique.mockResolvedValue({
        id: "mk1",
        studentId: "std1",
        tokenId: "tok1",
        classSessionId: "sess1",
        status: "scheduled",
        classSession: { offering: { termId: "term1" } },
      } as unknown as Awaited<ReturnType<typeof prismaMock.makeUpBooking.findUnique>>);

      const result = await service.updateMakeup(
        { makeUpId: "mk1", status: null },
        mockStaffUser,
      );

      expect(result).toEqual({ success: true });
      expect(tokensServiceMock.reconcileTokenOnCancellation).toHaveBeenCalled();
      expect(prismaMock.makeUpToken.update).not.toHaveBeenCalled();
      expect(prismaMock.makeUpBooking.delete).toHaveBeenCalledWith({
        where: { id: "mk1" },
      });
    });
  });

  describe("practiceCheckIn & getPracticeRoster", () => {
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

    it("should throw NotFoundException if class session not found", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue(null);

      await expect(
        service.practiceCheckIn(
          { classSessionId: "sess_999", studentId: "stu_1" },
          mockStaffUser,
        ),
      ).rejects.toThrow();
    });

    it("should reject check-in if pool capacity is reached", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 2,
          term: { locationId: "loc_1" },
        },
        attendance: [{ studentId: "s1" }, { studentId: "s2" }],
      } as any);

      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_1",
        studentId: "stu_1",
        seasonTermId: "term_1",
        allowedLocationIds: ["loc_1"],
        startDate: new Date("2026-09-01"),
        status: "active",
        lineItems: [],
      } as any);

      await expect(
        service.practiceCheckIn(
          { classSessionId: "sess_1", studentId: "stu_1" },
          mockStaffUser,
        ),
      ).rejects.toThrow("Pool capacity reached");
    });

    it("should require staff acknowledgment if balance is 1-10 days overdue", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 12,
          term: { locationId: "loc_1" },
        },
        attendance: [],
      } as any);

      // Overdue invoice created 5 days ago with due date 5 days ago
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_1",
        studentId: "stu_1",
        seasonTermId: "term_1",
        allowedLocationIds: ["loc_1"],
        startDate: new Date("2026-09-01"),
        status: "active",
        lineItems: [
          {
            feeType: "MONTHLY_PRACTICE",
            billingPeriod: "2026-10",
            invoice: {
              id: "inv_1",
              status: "partial",
              createdAt: fiveDaysAgo,
              totalAmount: 220,
              payments: [],
            },
          },
        ],
      } as any);

      // Without acknowledgeOverdue: true
      await expect(
        service.practiceCheckIn(
          { classSessionId: "sess_1", studentId: "stu_1", acknowledgeOverdue: false },
          mockStaffUser,
        ),
      ).rejects.toThrow("Staff acknowledgment required");
    });

    it("should allow check-in when staff acknowledges overdue payment", async () => {
      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 12,
          term: { locationId: "loc_1" },
        },
        attendance: [],
      } as any);

      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_1",
        studentId: "stu_1",
        student: { firstName: "Emma", lastName: "Wilson" },
        seasonTermId: "term_1",
        allowedLocationIds: ["loc_1"],
        startDate: new Date("2026-09-01"),
        status: "active",
        lineItems: [
          {
            feeType: "MONTHLY_PRACTICE",
            billingPeriod: "2026-10",
            invoice: {
              id: "inv_1",
              status: "partial",
              createdAt: fiveDaysAgo,
              totalAmount: 220,
              payments: [],
            },
          },
        ],
      } as any);

      prismaMock.attendance.upsert.mockResolvedValue({
        id: "att_1",
        studentId: "stu_1",
        classSessionId: "sess_1",
        membershipId: "mem_1",
        status: "present",
        acknowledgedOverdue: true,
      } as any);

      const res = await service.practiceCheckIn(
        { classSessionId: "sess_1", studentId: "stu_1", acknowledgeOverdue: true },
        mockStaffUser,
      );

      expect(res.attendance?.status).toBe("present");
      expect(res.attendance?.acknowledgedOverdue).toBe(true);
    });

    it("should lock account and throw ForbiddenException for instructor if overdue > 10 days", async () => {
      const mockCoach: RequestStaffUser = {
        ...mockStaffUser,
        role: "instructor",
      };

      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 12,
          term: { locationId: "loc_1" },
        },
        attendance: [],
      } as any);

      // Overdue 15 days ago
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_1",
        studentId: "stu_1",
        student: { firstName: "Emma", lastName: "Wilson" },
        seasonTermId: "term_1",
        allowedLocationIds: ["loc_1"],
        startDate: new Date("2026-09-01"),
        status: "active",
        lineItems: [
          {
            feeType: "MONTHLY_PRACTICE",
            billingPeriod: "2026-10",
            invoice: {
              id: "inv_1",
              status: "partial",
              createdAt: fifteenDaysAgo,
              totalAmount: 220,
              payments: [],
            },
          },
        ],
      } as any);

      await expect(
        service.practiceCheckIn(
          { classSessionId: "sess_1", studentId: "stu_1", acknowledgeOverdue: true },
          mockCoach,
        ),
      ).rejects.toThrow("Account is locked");
    });

    it("should allow supervisor to grant override for locked account (> 10 days overdue)", async () => {
      const mockSupervisor: RequestStaffUser = {
        ...mockStaffUser,
        role: "supervisor",
      };

      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 12,
          term: { locationId: "loc_1" },
        },
        attendance: [],
      } as any);

      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      prismaMock.studentMembership.findFirst.mockResolvedValue({
        id: "mem_1",
        studentId: "stu_1",
        student: { firstName: "Emma", lastName: "Wilson" },
        seasonTermId: "term_1",
        allowedLocationIds: ["loc_1"],
        startDate: new Date("2026-09-01"),
        status: "active",
        lineItems: [
          {
            feeType: "MONTHLY_PRACTICE",
            billingPeriod: "2026-10",
            invoice: {
              id: "inv_1",
              status: "partial",
              createdAt: fifteenDaysAgo,
              totalAmount: 220,
              payments: [],
            },
          },
        ],
      } as any);

      prismaMock.attendance.upsert.mockResolvedValue({
        id: "att_1",
        studentId: "stu_1",
        classSessionId: "sess_1",
        membershipId: "mem_1",
        status: "present",
        acknowledgedOverdue: true,
      } as any);

      const res = await service.practiceCheckIn(
        {
          classSessionId: "sess_1",
          studentId: "stu_1",
          overrideDelinquency: true,
        },
        mockSupervisor,
      );

      expect(res.attendance?.status).toBe("present");
      expect(res.attendance?.acknowledgedOverdue).toBe(true);
    });

    it("should deduplicate multi-item invoices when calculating balance", async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const sharedInvoice = {
        id: "inv_shared",
        status: "partial",
        createdAt: fiveDaysAgo,
        totalAmount: 370,
        payments: [{ amount: 100 }],
      };

      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "sess_1",
        date: new Date("2026-10-14"),
        offering: {
          termId: "term_1",
          capacity: 12,
          term: { locationId: "loc_1" },
        },
        attendance: [],
      } as any);

      prismaMock.studentMembership.findMany.mockResolvedValue([
        {
          id: "mem_1",
          studentId: "stu_1",
          student: { firstName: "Emma", lastName: "Wilson", level: "Senior" },
          seasonTermId: "term_1",
          allowedLocationIds: ["loc_1"],
          startDate: new Date("2026-09-01"),
          status: "active",
          lineItems: [
            {
              feeType: "ANNUAL_REGISTRATION",
              invoice: sharedInvoice,
            },
            {
              feeType: "MONTHLY_PRACTICE",
              billingPeriod: "2026-10",
              invoice: sharedInvoice,
            },
          ],
        },
      ] as any);

      const roster = await service.getPracticeRoster("sess_1", mockStaffUser);
      expect(roster.eligibleSwimmers).toHaveLength(1);
      // Balance is 370 - 100 = 270 (NOT 270 * 2 = 540)
      expect(roster.eligibleSwimmers[0].amountDue).toBe(270);
    });
  });
});
