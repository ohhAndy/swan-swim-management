import { Test, TestingModule } from "@nestjs/testing";
import { MakeupsService } from "./makeups.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { TokensService } from "../tokens/tokens.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { BadRequestException } from "@nestjs/common";
import { RequestStaffUser } from "../auth/auth.types";
import { ScheduleMakeUpInput } from "./dto/schedule-makeup.dto";
import { Student, MakeUpToken, MakeUpBooking } from "@prisma/client";

// Mock countUsedSeatsForSession
jest.mock("../sessions/sessions.helpers", () => ({
  countUsedSeatsForSession: jest.fn().mockResolvedValue({ filled: 1, effectiveCapacity: 4 }),
}));

// Mock validateLocationAccess
jest.mock("../common/helpers/location-access.helper", () => ({
  validateLocationAccess: jest.fn(),
}));

describe("MakeupsService", () => {
  let service: MakeupsService;
  let prismaMock: MockPrismaService;
  let tokensServiceMock: Partial<TokensService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    tokensServiceMock = {
      consumeAvailableToken: jest.fn().mockResolvedValue({ id: "tok1", status: "consumed" } as unknown as MakeUpToken),
      getTokenBalance: jest.fn().mockResolvedValue({ total: 2, available: 0, consumed: 2, expired: 0, voided: 0, overrideCount: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeupsService,
        AuditLogsService,
        { provide: TokensService, useValue: tokensServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MakeupsService>(MakeupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("scheduleMakeUp", () => {
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
    const mockDto: ScheduleMakeUpInput = {
      studentId: "student1",
      classSessionId: "target1",
      notes: "Test makeup",
      classRatio: "3:1",
      overrideAcknowledged: false,
    };

    it("should throw BadRequestException if session not found", async () => {
      prismaMock.student.findUnique.mockResolvedValue({ id: "student1", firstName: "A", lastName: "B" } as unknown as Student);
      prismaMock.classSession.findUnique.mockResolvedValue(null);

      await expect(service.scheduleMakeUp(mockDto, mockStaffUser)).rejects.toThrow(BadRequestException);
    });

    it("should correctly create a makeup booking and consume token", async () => {
      prismaMock.student.findUnique.mockResolvedValue({
        id: "student1",
        firstName: "John",
        lastName: "Doe",
        birthdate: new Date("2010-01-01"),
        level: "Beginner",
      } as unknown as Student);

      prismaMock.classSession.findUnique.mockResolvedValue({
        id: "target1",
        offering: { termId: "term1", term: { id: "term1", name: "Term 1", locationId: "loc1" } },
      } as unknown as Awaited<ReturnType<typeof prismaMock.classSession.findUnique>>);
      prismaMock.makeUpBooking.findUnique.mockResolvedValue(null); // No duplicate
      
      // We need available > 0 to pass the pre-transaction check
      (tokensServiceMock.getTokenBalance as jest.Mock).mockResolvedValueOnce({ available: 1 });

      const mockBooking = {
        id: "bk1",
        status: "scheduled",
        student: { firstName: "John", lastName: "Doe", birthdate: new Date("2010-01-01"), level: "Beginner" },
        classSession: { date: new Date("2024-01-01") },
      };
      prismaMock.makeUpBooking.create.mockResolvedValue(mockBooking as unknown as MakeUpBooking);

      const result = await service.scheduleMakeUp(mockDto, mockStaffUser);

      expect(result).toEqual({ makeUpId: "bk1", status: "scheduled", isOverride: false, tokenId: "tok1" });
      expect(prismaMock.makeUpBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: "student1",
            classSessionId: "target1",
            tokenId: "tok1",
            isOverride: false,
          }),
        }),
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });
});
