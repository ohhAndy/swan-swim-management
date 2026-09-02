import { Test, TestingModule } from "@nestjs/testing";
import { TokensService } from "./tokens.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { RequestStaffUser } from "../auth/auth.types";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma, MakeUpToken, Enrollment, MakeUpBooking } from "@prisma/client";

describe("TokensService", () => {
  let service: TokensService;
  let prismaMock: MockPrismaService;

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

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        AuditLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("autoGrantTokens", () => {
    it("should create 2 available tokens for enrollment", async () => {
      prismaMock.makeUpToken.create
        .mockResolvedValueOnce({ id: "tok1", status: "available" } as unknown as MakeUpToken)
        .mockResolvedValueOnce({ id: "tok2", status: "available" } as unknown as MakeUpToken);

      const tokens = await service.autoGrantTokens("enr1");
      expect(tokens).toHaveLength(2);
      expect(prismaMock.makeUpToken.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("grantExtraTokens", () => {
    it("should grant extra tokens and log audit trail", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue({
        id: "enr1",
        student: { id: "std1", firstName: "John", lastName: "Doe" },
        offering: { title: "Mon 4pm", term: { id: "term1", name: "Fall 2026" } },
      } as unknown as Enrollment);

      prismaMock.makeUpToken.create.mockResolvedValue({ id: "tok_extra", status: "available" } as unknown as MakeUpToken);

      const tokens = await service.grantExtraTokens(
        { enrollmentId: "enr1", count: 1, notes: "Medical exception" },
        mockStaffUser,
      );

      expect(tokens).toHaveLength(1);
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should throw NotFoundException if enrollment does not exist", async () => {
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.grantExtraTokens(
          { enrollmentId: "enr_none", count: 1, notes: "Test" },
          mockStaffUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("voidToken", () => {
    it("should void an available token", async () => {
      prismaMock.makeUpToken.findUnique.mockResolvedValue({
        id: "tok1",
        status: "available",
        enrollment: { student: { firstName: "John", lastName: "Doe" } },
      } as unknown as MakeUpToken);
      prismaMock.makeUpToken.update.mockResolvedValue({ id: "tok1", status: "voided" } as unknown as MakeUpToken);

      const res = await service.voidToken("tok1", { notes: "Mistake" }, mockStaffUser);
      expect(res.status).toBe("voided");
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should throw BadRequestException if token is already consumed", async () => {
      prismaMock.makeUpToken.findUnique.mockResolvedValue({
        id: "tok1",
        status: "consumed",
        enrollment: { student: { firstName: "John", lastName: "Doe" } },
      } as unknown as MakeUpToken);

      await expect(
        service.voidToken("tok1", { notes: "Mistake" }, mockStaffUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getTokenBalance", () => {
    it("should correctly compute balance including expired and override count", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: "enr1",
          offering: { term: { id: "term1", name: "Fall", endDate: futureDate } },
          makeUpTokens: [
            { id: "t1", status: "available" },
            { id: "t2", status: "consumed" },
          ],
        },
      ] as unknown as Enrollment[]);

      prismaMock.makeUpBooking.count.mockResolvedValue(1); // 1 override

      const balance = await service.getTokenBalance("std1", "term1");
      expect(balance).toEqual({
        total: 2,
        available: 1,
        consumed: 1,
        expired: 0,
        voided: 0,
        overrideCount: 1,
      });
    });
  });

  describe("reconcileTokenOnCancellation", () => {
    it("should transfer token to active override and clear override flag", async () => {
      const cancelledBooking = {
        id: "bk_cancelled",
        studentId: "std1",
        tokenId: "tok_freed",
        classSession: { offering: { termId: "term1" } },
      };

      prismaMock.makeUpBooking.findFirst.mockResolvedValue({
        id: "bk_override",
        studentId: "std1",
        isOverride: true,
        status: "scheduled",
        student: { firstName: "Jane", lastName: "Doe" },
      } as unknown as MakeUpBooking);

      prismaMock.makeUpBooking.update.mockResolvedValue({
        id: "bk_override",
        tokenId: "tok_freed",
        isOverride: false,
      } as unknown as MakeUpBooking);

      const result = await service.reconcileTokenOnCancellation(
        cancelledBooking,
        mockStaffUser,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(result).toBe(true);
      expect(prismaMock.makeUpBooking.update).toHaveBeenCalledWith({
        where: { id: "bk_override" },
        data: {
          tokenId: "tok_freed",
          isOverride: false,
        },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it("should return false if no active override exists", async () => {
      const cancelledBooking = {
        id: "bk_cancelled",
        studentId: "std1",
        tokenId: "tok_freed",
        classSession: { offering: { termId: "term1" } },
      };

      prismaMock.makeUpBooking.findFirst.mockResolvedValue(null);

      const result = await service.reconcileTokenOnCancellation(
        cancelledBooking,
        mockStaffUser,
        prismaMock as unknown as Prisma.TransactionClient,
      );

      expect(result).toBe(false);
      expect(prismaMock.makeUpBooking.update).not.toHaveBeenCalled();
    });
  });

  describe("consumeAvailableToken", () => {
    it("should consume the earliest available token", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: "enr1",
          offering: { term: { endDate: futureDate } },
          makeUpTokens: [
            { id: "tok1", status: "available", grantedAt: new Date("2026-01-01") },
            { id: "tok2", status: "available", grantedAt: new Date("2026-01-02") },
          ],
        },
      ] as unknown as Awaited<ReturnType<typeof prismaMock.enrollment.findMany>>);

      prismaMock.makeUpToken.update.mockResolvedValue({
        id: "tok1",
        status: "consumed",
        consumedAt: new Date(),
      } as unknown as MakeUpToken);

      const result = await service.consumeAvailableToken("std1", "term1", prismaMock as unknown as Prisma.TransactionClient);
      expect(result).toBeDefined();
      expect(result?.id).toBe("tok1");
      expect(prismaMock.makeUpToken.update).toHaveBeenCalledWith({
        where: { id: "tok1" },
        data: {
          status: "consumed",
          consumedAt: expect.any(Date),
        },
      });
    });

    it("should return null when no enrollments exist", async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const result = await service.consumeAvailableToken("std1", "term1", prismaMock as unknown as Prisma.TransactionClient);
      expect(result).toBeNull();
    });

    it("should return null when all tokens are consumed", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: "enr1",
          offering: { term: { endDate: futureDate } },
          makeUpTokens: [], // No available tokens (consumed ones are filtered by the query)
        },
      ] as unknown as Awaited<ReturnType<typeof prismaMock.enrollment.findMany>>);

      const result = await service.consumeAvailableToken("std1", "term1", prismaMock as unknown as Prisma.TransactionClient);
      expect(result).toBeNull();
    });

    it("should return null when term has ended even if tokens are available", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: "enr1",
          offering: { term: { endDate: pastDate } },
          makeUpTokens: [
            { id: "tok1", status: "available" },
          ],
        },
      ] as unknown as Awaited<ReturnType<typeof prismaMock.enrollment.findMany>>);

      const result = await service.consumeAvailableToken("std1", "term1", prismaMock as unknown as Prisma.TransactionClient);
      expect(result).toBeNull();
      expect(prismaMock.makeUpToken.update).not.toHaveBeenCalled();
    });
  });

  describe("voidToken - already voided", () => {
    it("should throw BadRequestException if token is already voided", async () => {
      prismaMock.makeUpToken.findUnique.mockResolvedValue({
        id: "tok1",
        status: "voided",
        enrollment: { student: { firstName: "John", lastName: "Doe" } },
      } as unknown as MakeUpToken);

      await expect(
        service.voidToken("tok1", { notes: "Try again" }, mockStaffUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
