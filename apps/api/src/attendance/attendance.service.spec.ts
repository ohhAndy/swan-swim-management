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
  });
});
