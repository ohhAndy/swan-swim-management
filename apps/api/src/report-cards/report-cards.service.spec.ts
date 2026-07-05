import { Test, TestingModule } from "@nestjs/testing";
import { ReportCardsService } from "./report-cards.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { CommunicationsService } from "../communications/communications.service";
import { RequestStaffUser } from "../auth/auth.types";
import { ReportCardStatus } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";

describe("ReportCardsService", () => {
  let service: ReportCardsService;
  let prismaMock: MockPrismaService;
  let communicationsServiceMock: Partial<CommunicationsService>;

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
    communicationsServiceMock = {
      sendEmail: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCardsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CommunicationsService, useValue: communicationsServiceMock },
      ],
    }).compile();

    service = module.get<ReportCardsService>(ReportCardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a report card and log the audit event", async () => {
      const mockReportCard = {
        id: "rc1",
        enrollmentId: "enr1",
        levelId: "lvl1",
        status: ReportCardStatus.draft,
      };

      prismaMock.reportCard.create.mockResolvedValue(mockReportCard as any);
      prismaMock.enrollment.update.mockResolvedValue({ id: "enr1" } as any);

      // Prisma transaction mock bypasses wrapper, so we stub directly
      prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

      const result = await service.create(
        {
          enrollmentId: "enr1",
          levelId: "lvl1",
          status: ReportCardStatus.draft,
          skills: [],
        },
        mockStaffUser
      );

      expect(result).toBeDefined();
      expect(prismaMock.reportCard.create).toHaveBeenCalled();
      expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
        where: { id: "enr1" },
        data: { reportCardStatus: ReportCardStatus.draft },
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "Create Report Card",
            entityId: "rc1",
          }),
        })
      );
    });
  });

  describe("remove", () => {
    it("should throw NotFoundException if report card doesn't exist", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

      await expect(service.remove("non-existent", mockStaffUser)).rejects.toThrow(NotFoundException);
    });

    it("should successfully remove report card and write audit log", async () => {
      const mockReportCard = {
        id: "rc1",
        enrollmentId: "enr1",
        status: ReportCardStatus.draft,
      };

      prismaMock.reportCard.findUnique.mockResolvedValue(mockReportCard as any);
      prismaMock.reportCard.delete.mockResolvedValue(mockReportCard as any);
      prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));

      const result = await service.remove("rc1", mockStaffUser);

      expect(result).toBeDefined();
      expect(prismaMock.reportCard.delete).toHaveBeenCalledWith({ where: { id: "rc1" } });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "Delete Report Card",
            entityId: "rc1",
          }),
        })
      );
    });
  });
});
