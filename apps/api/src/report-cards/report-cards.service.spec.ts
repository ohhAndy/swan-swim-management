import { Test, TestingModule } from "@nestjs/testing";
import { ReportCardsService } from "./report-cards.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { CommunicationsService } from "../communications/communications.service";
import { RequestStaffUser } from "../auth/auth.types";
import { ReportCardSendStatus, ReportCardStatus } from "@prisma/client";
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

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
      sendEmail: jest.fn().mockResolvedValue({
        success: true,
        logId: "log1",
        results: [{ email: "pat@test.com", status: "sent", resendId: "re_1" }],
      }),
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
    const buildCard = (
      status: ReportCardStatus,
      lastSendStatus: ReportCardSendStatus | null = null,
    ) => ({
      id: "rc1",
      enrollmentId: "enr1",
      levelId: "lvl1",
      status,
      lastSendStatus,
      sendAttempts: 0,
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
      prismaMock.reportCard.updateMany.mockResolvedValue({ count: 1 } as never);
    });

    const sendFailure = (error: string) => ({
      success: false,
      total: 1,
      successCount: 0,
      failureCount: 1,
      status: "failed",
      logId: "log-failed",
      mock: false,
      results: [{ email: "pat@test.com", status: "failed", error, updatedAt: "" }],
    });

    it("keeps the card unsent and records the error when the provider fails", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.completed) as never,
      );
      (communicationsServiceMock.sendEmail as jest.Mock).mockResolvedValue(
        sendFailure("Rate limit exceeded"),
      );

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(BadGatewayException);

      expect(prismaMock.reportCard.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.reportCard.update).toHaveBeenCalledWith({
        where: { id: "rc1" },
        data: {
          lastSendStatus: ReportCardSendStatus.failed,
          lastSendError: "Rate limit exceeded",
          communicationLogId: "log-failed",
        },
      });
      expect(prismaMock.enrollment.update).not.toHaveBeenCalled();
      expect(prismaMock.student.update).not.toHaveBeenCalled();
    });

    it("records a failure when sendEmail throws", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.completed) as never,
      );
      (communicationsServiceMock.sendEmail as jest.Mock).mockRejectedValue(
        new Error("network down"),
      );

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(BadGatewayException);

      expect(prismaMock.reportCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastSendStatus: ReportCardSendStatus.failed,
            lastSendError: "network down",
          }),
        }),
      );
    });

    it("allows retrying a sent card whose email bounced", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.sent, ReportCardSendStatus.bounced) as never,
      );

      await service.emailReportCard("rc1", "pdf", mockStaffUser);

      expect(communicationsServiceMock.sendEmail).toHaveBeenCalled();
      expect(prismaMock.reportCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastSendStatus: ReportCardSendStatus.sent,
            communicationLogId: "log1",
          }),
        }),
      );
      // Upgrade already happened on the original send.
      expect(prismaMock.student.update).not.toHaveBeenCalled();
    });

    it("rejects re-sending a delivered card unless forced", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.sent, ReportCardSendStatus.delivered) as never,
      );

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(ForbiddenException);
      expect(communicationsServiceMock.sendEmail).not.toHaveBeenCalled();

      await service.emailReportCard("rc1", "pdf", mockStaffUser, { force: true });
      expect(communicationsServiceMock.sendEmail).toHaveBeenCalledTimes(1);
    });

    it("rejects a concurrent send while another is pending", async () => {
      prismaMock.reportCard.findUnique.mockResolvedValue(
        buildCard(ReportCardStatus.completed, ReportCardSendStatus.pending) as never,
      );
      prismaMock.reportCard.updateMany.mockResolvedValue({ count: 0 } as never);

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(ConflictException);
      expect(communicationsServiceMock.sendEmail).not.toHaveBeenCalled();
    });

    it("rejects with 400 when the guardian has no email", async () => {
      const card = buildCard(ReportCardStatus.completed);
      card.enrollment.student.guardian.email = "";
      prismaMock.reportCard.findUnique.mockResolvedValue(card as never);

      await expect(
        service.emailReportCard("rc1", "pdf", mockStaffUser),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.reportCard.updateMany).not.toHaveBeenCalled();
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
