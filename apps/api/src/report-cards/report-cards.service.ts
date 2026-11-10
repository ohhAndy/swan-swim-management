import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
  ConflictException,
} from "@nestjs/common";
import { Prisma, ReportCardSendStatus } from "@prisma/client";
import { CreateReportCardDto } from "./dto/create-report-card.dto";
import { UpdateReportCardDto } from "./dto/update-report-card.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CommunicationsService } from "../communications/communications.service";
import { RequestStaffUser } from "../auth/auth.types";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

const STALE_PENDING_MS = 5 * 60 * 1000;

@Injectable()
export class ReportCardsService {
  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Advances the student to the level after `reportCardLevelId`, unless they are
   * already at or beyond it. Idempotent, so safe to call more than once.
   */
  private async upgradeStudentLevel(
    tx: Prisma.TransactionClient,
    studentId: string,
    reportCardLevelId: string | null | undefined,
  ) {
    if (!reportCardLevelId) return;

    const currentLevel = await tx.level.findUnique({
      where: { id: reportCardLevelId },
    });
    if (!currentLevel) return;

    const nextLevel = await tx.level.findFirst({
      where: { order: { gt: currentLevel.order } },
      orderBy: { order: "asc" },
    });
    if (!nextLevel) return;

    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { levelModel: { select: { order: true } } },
    });
    const studentCurrentLevelOrder = student?.levelModel?.order ?? -1;

    if (nextLevel.order > studentCurrentLevelOrder) {
      await tx.student.update({
        where: { id: studentId },
        data: { level: nextLevel.name, levelId: nextLevel.id },
      });
    }
  }

  async create(
    createReportCardDto: CreateReportCardDto,
    staffUser: RequestStaffUser,
  ) {
    const { skills, ...reportCardData } = createReportCardDto;

    return this.prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.create({
        data: {
          ...reportCardData,
          createdBy: staffUser.id,
          reportCardSkills: {
            create: skills?.map((skill) => ({
              skillId: skill.skillId,
              status: skill.status,
            })),
          },
        },
        include: {
          reportCardSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

      // Sync report card status back to the Enrollment
      await tx.enrollment.update({
        where: { id: reportCard.enrollmentId },
        data: { reportCardStatus: reportCard.status },
      });

      // Automatically upgrade student level if report card is created as completed
      if (reportCard.status === "completed") {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: reportCard.enrollmentId },
          select: { studentId: true },
        });
        if (enrollment) {
          await this.upgradeStudentLevel(
            tx,
            enrollment.studentId,
            reportCard.levelId,
          );
        }
      }

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Create Report Card",
          entityType: "ReportCard",
          entityId: reportCard.id,
          metadata: {
            enrollmentId: reportCard.enrollmentId,
            levelId: reportCard.levelId,
            status: reportCard.status,
          },
        },
        tx,
      );

      return reportCard;
    });
  }

  findAll() {
    return this.prisma.reportCard.findMany({
      include: {
        createdByUser: {
          select: {
            fullName: true,
          },
        },
        updatedByUser: {
          select: {
            fullName: true,
          },
        },
        sentByUser: {
          select: {
            fullName: true,
          },
        },
        enrollment: {
          include: {
            student: true,
            offering: true,
          },
        },
        level: true,
        reportCardSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const reportCard = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            fullName: true,
          },
        },
        updatedByUser: {
          select: {
            fullName: true,
          },
        },
        sentByUser: {
          select: {
            fullName: true,
          },
        },
        enrollment: {
          include: {
            student: {
              include: {
                guardian: true,
              },
            },
            offering: {
              include: {
                term: true,
              },
            },
          },
        },
        level: {
          include: {
            skills: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        reportCardSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!reportCard) {
      throw new NotFoundException(`Report card with ID ${id} not found`);
    }

    return reportCard;
  }

  async update(
    id: string,
    updateReportCardDto: UpdateReportCardDto,
    staffUser: RequestStaffUser,
  ) {
    const { skills, ...reportCardData } = updateReportCardDto;

    // Fetch existing report card to check its status before updating
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        enrollment: { select: { studentId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Report card with ID ${id} not found`);
    }

    // Enforce that completed/sent report cards cannot be edited
    if (existing.status === "completed" || existing.status === "sent") {
      throw new ForbiddenException(
        "Cannot modify a completed or sent report card",
      );
    }


    await this.prisma.$transaction(async (tx) => {
      // First update the report card basic data
      const reportCard = await tx.reportCard.update({
        where: { id },
        data: {
          ...reportCardData,
          updatedBy: staffUser.id,
        },
      });

      // Sync report card status back to the Enrollment
      await tx.enrollment.update({
        where: { id: existing.enrollmentId },
        data: { reportCardStatus: reportCard.status },
      });

      // Automatically upgrade student level if report card is marked as completed
      if (reportCard.status === "completed") {
        await this.upgradeStudentLevel(
          tx,
          existing.enrollment.studentId,
          reportCard.levelId || existing.levelId,
        );
      }

      // If skills are provided, upsert them
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          // Check if a record already exists for this report card and skill
          const existingSkill = await tx.reportCardSkill.findUnique({
            where: {
              reportCardId_skillId: {
                reportCardId: id,
                skillId: skill.skillId,
              },
            },
          });

          if (existingSkill) {
            await tx.reportCardSkill.update({
              where: {
                reportCardId_skillId: {
                  reportCardId: id,
                  skillId: skill.skillId,
                },
              },
              data: {
                status: skill.status,
              },
            });
          } else {
            await tx.reportCardSkill.create({
              data: {
                reportCardId: id,
                skillId: skill.skillId,
                status: skill.status,
              },
            });
          }
        }
      }

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Update Report Card",
          entityType: "ReportCard",
          entityId: id,
          metadata: {
            status: reportCard.status,
          },
          changes: {
            comments: { from: existing.comments, to: reportCard.comments },
            status: { from: existing.status, to: reportCard.status },
          },
        },
        tx,
      );
    });

    return this.findOne(id);
  }

  async remove(id: string, staffUser: RequestStaffUser) {
    return this.prisma.$transaction(async (tx) => {
      const reportCard = await tx.reportCard.findUnique({
        where: { id },
      });
      if (!reportCard) {
        throw new NotFoundException(`Report card with ID ${id} not found`);
      }

      await tx.reportCard.delete({
        where: { id },
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Delete Report Card",
          entityType: "ReportCard",
          entityId: id,
          metadata: {
            enrollmentId: reportCard.enrollmentId,
            status: reportCard.status,
          },
        },
        tx,
      );

      return reportCard;
    });
  }

  async emailReportCard(
    id: string,
    pdfContent: string,
    staffUser: RequestStaffUser,
    options: { force?: boolean } = {},
  ) {
    const force = options.force ?? false;
    const reportCard = await this.findOne(id);
    const previousSendStatus = reportCard.lastSendStatus;

    if (reportCard.status === "sent") {
      const retryable =
        previousSendStatus === ReportCardSendStatus.failed ||
        previousSendStatus === ReportCardSendStatus.bounced;
      if (!retryable && !force) {
        throw new ForbiddenException(
          'This report card has already been sent. Use "Send again" to email another copy.',
        );
      }
    } else if (
      // Only finalised report cards may be sent. Sending a draft used to jump
      // straight to "sent" and skip the level upgrade that happens on "completed".
      reportCard.status !== "completed" &&
      reportCard.status !== "did_not_pass"
    ) {
      throw new BadRequestException(
        'Save the report card as "Completed" or "Did Not Pass" before emailing it.',
      );
    }

    const student = reportCard.enrollment.student;
    const guardian = student.guardian;

    if (!guardian?.email) {
      throw new BadRequestException(
        "The guardian does not have an email address on file.",
      );
    }

    // Claim the send so concurrent requests can't email twice; stale claims expire.
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_PENDING_MS);
    const claim = await this.prisma.reportCard.updateMany({
      where: {
        id,
        status: reportCard.status,
        OR: [
          { lastSendStatus: null },
          { lastSendStatus: { not: ReportCardSendStatus.pending } },
          { lastSendAttemptAt: { lt: staleBefore } },
        ],
      },
      data: {
        lastSendStatus: ReportCardSendStatus.pending,
        lastSendAttemptAt: now,
        lastSendError: null,
        sendAttempts: { increment: 1 },
      },
    });
    if (claim.count === 0) {
      throw new ConflictException(
        "This report card is already being sent. Please wait a moment and refresh.",
      );
    }
    const attempt = reportCard.sendAttempts + 1;

    const termName = reportCard.enrollment.offering.term
      ? reportCard.enrollment.offering.term["name"]
      : "Current Term";

    // sendEmail reports provider failures in its result rather than throwing.
    let sendResult: Awaited<ReturnType<CommunicationsService["sendEmail"]>>;
    try {
      sendResult = await this.communicationsService.sendEmail(
        {
          recipients: [guardian.email],
          subject: `Progress Report for ${student.firstName} - ${termName}`,
          body: `Dear ${guardian.fullName},\n\nPlease find attached the progress report for ${student.firstName}.\n\nBest regards,\nSwan Swim School`,
          attachments: [
            {
              filename: `Progress_Report_${student.firstName}_${student.lastName}.pdf`,
              content: pdfContent,
            },
          ],
        },
        staffUser,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await this.recordSendFailure(id, message, staffUser, {
        recipient: guardian.email,
        attempt,
        previousSendStatus,
      });
      throw new BadGatewayException(
        `Failed to email the report card to ${guardian.email}: ${message}`,
      );
    }

    if (!sendResult.success) {
      const message =
        sendResult.results.find((r) => r.status === "failed")?.error ??
        "The email provider rejected the message.";
      await this.recordSendFailure(id, message, staffUser, {
        recipient: guardian.email,
        attempt,
        previousSendStatus,
        communicationLogId: sendResult.logId,
      });
      throw new BadGatewayException(
        `Failed to email the report card to ${guardian.email}: ${message}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Update status, sentAt, and sentById
      await tx.reportCard.update({
        where: { id },
        data: {
          status: "sent",
          sentAt: new Date(),
          sentById: staffUser.id,
          lastSendStatus: ReportCardSendStatus.sent,
          lastSendError: null,
          communicationLogId: sendResult.logId,
        },
      });

      // Sync reportCardStatus to enrollment
      await tx.enrollment.update({
        where: { id: reportCard.enrollmentId },
        data: { reportCardStatus: "sent" },
      });

      // Safety net: guarantee a passed student is upgraded before the card is
      // locked as "sent". No-op if the upgrade already happened on completion.
      if (reportCard.status === "completed") {
        await this.upgradeStudentLevel(
          tx,
          reportCard.enrollment.studentId,
          reportCard.levelId,
        );
      }

      // Write Audit Log
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Send Report Card",
          entityType: "ReportCard",
          entityId: id,
          metadata: {
            recipient: guardian.email,
            studentName: `${student.firstName} ${student.lastName}`,
            attempt,
            force,
            previousSendStatus,
            communicationLogId: sendResult.logId,
          },
        },
        tx,
      );
    });

    return { success: true, attempt, communicationLogId: sendResult.logId };
  }

  private async recordSendFailure(
    id: string,
    error: string,
    staffUser: RequestStaffUser,
    details: {
      recipient: string;
      attempt: number;
      previousSendStatus: ReportCardSendStatus | null;
      communicationLogId?: string;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.reportCard.update({
        where: { id },
        data: {
          lastSendStatus: ReportCardSendStatus.failed,
          lastSendError: error,
          ...(details.communicationLogId && {
            communicationLogId: details.communicationLogId,
          }),
        },
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Report Card Send Failed",
          entityType: "ReportCard",
          entityId: id,
          metadata: { ...details, error },
        },
        tx,
      );
    });
  }
}
