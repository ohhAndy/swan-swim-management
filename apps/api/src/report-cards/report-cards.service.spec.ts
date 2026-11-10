import { Test, TestingModule } from "@nestjs/testing";
import { ReportCardsService } from "./report-cards.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { CommunicationsService } from "../communications/communications.service";
import { RequestStaffUser } from "../auth/auth.types";
import { ReportCardStatus } from "@prisma/client";
import { BadRequestException, NotFoundException } from "@nestjs/common";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

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
        AuditLogsService,
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

  describe("emailReportCard", () => {
    const buildCard = (status: ReportCardStatus) => ({
      id: "rc1",
      enrollmentId: "enr1",
      levelId: "lvl1",
      status,
      enrollment: {
        studentId: "stu1",
        student: {
          firstName: "Sam",
          lastName: "Swimmer",
          guardian: { fullName: "Pat Swimmer", email: "pat@test.com" },
        },
        offering: { term: { name: "Fall 2026" } },
      },
    });

    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
      prismaMock.level.findUnique.mockResolvedValue({ id: "lvl1", order: 7 } as never);
      prismaMock.level.findFirst.mockResolvedValue({
        id: "lvl2",
        name: "Swimmer 1.2",
        order: 8,
      } as never);
      prismaMock.student.findUnique.mockResolvedValue({ levelModel: { order: 7 } } as never);
    });

    it("rejects emailing a draft and does not send anything", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.draft) as never,
      );

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(BadRequestException);
      expect(communicationsServiceMock.sendEmail).not.toHaveBeenCalled();
      expect(prismaMock.reportCard.update).not.toHaveBeenCalled();
    });

    it("upgrades the student when sending a completed card", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.completed) as never,
      );

      await service.emailReportCard("rc1", "pdf", mockStaffUser);

      expect(prismaMock.reportCard.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "sent" }) }),
      );
      expect(prismaMock.student.update).toHaveBeenCalledWith({
        where: { id: "stu1" },
        data: { level: "Swimmer 1.2", levelId: "lvl2" },
      });
    });

    it("does not re-upgrade a student who is already at the next level", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.completed) as never,
      );
      prismaMock.student.findUnique.mockResolvedValue({ levelModel: { order: 8 } } as never);

      await service.emailReportCard("rc1", "pdf", mockStaffUser);

      expect(prismaMock.student.update).not.toHaveBeenCalled();
    });

    it("sends a did-not-pass card without upgrading", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.did_not_pass) as never,
      );

      await service.emailReportCard("rc1", "pdf", mockStaffUser);

      expect(communicationsServiceMock.sendEmail).toHaveBeenCalled();
      expect(prismaMock.student.update).not.toHaveBeenCalled();
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
