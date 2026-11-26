import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import {
  RecipientFilterDto,
  SendEmailDto,
  GetCommunicationHistoryDto,
  ResendWebhookEvent,
  ResendWebhookEventSchema,
} from "./dto/communications.dto";
import {
  CommunicationRecipientStatus,
  CommunicationStatus,
  Prisma,
  ReportCardSendStatus,
} from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";
import { Resend } from "resend";
import { EmailDispatchService } from "./email-dispatch.service";
import {
  accessibleFilter,
  assertCanAccessLocation,
  LocationScope,
} from "../auth/location-scope";

export interface RecipientSendResult {
  email: string;
  status: CommunicationRecipientStatus;
  resendId?: string;
  error?: string;
  updatedAt: string;
}

export interface SendEmailResult {
  success: boolean;
  total: number;
  successCount: number;
  failureCount: number;
  status: CommunicationStatus;
  logId: string;
  mock: boolean;
  results: RecipientSendResult[];
}

// Resend's 40MB limit, less headroom for the message body and headers.
const MAX_ENCODED_ATTACHMENT_BYTES = 38 * 1024 * 1024;

const RECIPIENT_RESULT_SELECT = {
  email: true,
  status: true,
  resendId: true,
  error: true,
  updatedAt: true,
} satisfies Prisma.CommunicationRecipientSelect;

type RecipientRow = Prisma.CommunicationRecipientGetPayload<{
  select: typeof RECIPIENT_RESULT_SELECT;
}>;

function toRecipientResult(row: RecipientRow): RecipientSendResult {
  return {
    email: row.email,
    status: row.status,
    ...(row.resendId ? { resendId: row.resendId } : {}),
    ...(row.error ? { error: row.error } : {}),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dispatcher: EmailDispatchService,
  ) {
    // The Resend SDK throws on a missing key, which would stop the whole app
    // from booting (e.g. in tests, where the key is blanked on purpose).
    // Sending already falls back to mock mode without a real key, and webhook
    // verification never calls the API, so a placeholder is safe here.
    this.resend = new Resend(
      process.env.RESEND_API_KEY || "re_not_configured",
    );
  }

  async getRecipients(filters: RecipientFilterDto, scope: LocationScope) {
    const {
      locationId,
      termId,
      level,
      dayOfWeek,
      startTime,
      endTime,
      instructorId,
      enrollmentStatus = "active",
    } = filters;

    const studentWhere: Prisma.StudentWhereInput = {
      guardian: {
        email: { not: "" },
      },
    };

    if (level) {
      studentWhere.level = level;
    }

    if (enrollmentStatus === "inactive") {
      studentWhere.enrollments = { none: { status: "active" } };
    }

    const where: Prisma.EnrollmentWhereInput = {
      ...(enrollmentStatus === "active" ? { status: "active" } : {}),
      student: studentWhere,
    };

    if (locationId) assertCanAccessLocation(scope, locationId);

    // Filter by Location/Term via Offering
    where.offering = {
      ...(dayOfWeek !== undefined ? { weekday: dayOfWeek } : {}),
      ...(startTime ? { startTime: { gte: startTime } } : {}),
      ...(endTime ? { endTime: { lte: endTime } } : {}),
      term: {
        ...(termId ? { id: termId } : {}),
        locationId: locationId ?? accessibleFilter(scope),
      },
      ...(instructorId
        ? {
            instructors: {
              some: {
                instructorId,
                removedAt: null,
              },
            },
          }
        : {}),
    };

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      select: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            guardian: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Deduplicate guardians
    const uniqueGuardians = new Map<
      string,
      { id: string; name: string; email: string; students: string[] }
    >();

    for (const enrollment of enrollments) {
      const g = enrollment.student.guardian;
      const studentName = `${enrollment.student.firstName} ${enrollment.student.lastName}`;

      if (!uniqueGuardians.has(g.email)) {
        uniqueGuardians.set(g.email, {
          id: g.id,
          name: g.fullName,
          email: g.email,
          students: [studentName],
        });
      } else {
        const entry = uniqueGuardians.get(g.email);
        if (entry && !entry.students.includes(studentName)) {
          entry.students.push(studentName);
        }
      }
    }

    return Array.from(uniqueGuardians.values());
  }

  // Returns once queued; waitForCompletion is for single sends like report cards.
  async sendEmail(
    dto: SendEmailDto,
    staffUser?: RequestStaffUser,
    options: { waitForCompletion?: boolean } = {},
  ): Promise<SendEmailResult> {
    const { subject, body } = dto;
    const attachments = dto.attachments ?? [];

    const encodedSize = attachments.reduce((sum, a) => sum + a.content.length, 0);
    if (encodedSize > MAX_ENCODED_ATTACHMENT_BYTES) {
      throw new BadRequestException(
        "Attachments are too large. Keep the total under about 28MB.",
      );
    }

    const seen = new Set<string>();
    const recipients = dto.recipients.filter((email) => {
      const key = email.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const isMock = this.dispatcher.isMock;
    this.logger.log(
      `Queueing email to ${recipients.length} recipients (${attachments.length} attachment(s))`,
    );

    const log = await this.prisma.$transaction(async (tx) => {
      const created = await tx.communicationLog.create({
        data: {
          staffId: staffUser?.id ?? null,
          subject,
          body,
          status: CommunicationStatus.queued,
          recipientCount: recipients.length,
          attachmentCount: attachments.length,
        },
        select: { id: true },
      });

      await tx.communicationRecipient.createMany({
        data: recipients.map((email) => ({
          communicationLogId: created.id,
          email,
        })),
      });

      if (attachments.length > 0) {
        await tx.communicationAttachment.createMany({
          data: attachments.map((a) => ({
            communicationLogId: created.id,
            filename: a.filename,
            content: Buffer.from(a.content, "base64"),
          })),
        });
      }

      return created;
    });

    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "Send Email",
        entityType: "Communication",
        entityId: log.id,
        metadata: {
          subject,
          recipientCount: recipients.length,
          attachmentCount: attachments.length,
          mock: isMock,
        },
      });
    }

    if (options.waitForCompletion) {
      await this.dispatcher.process(log.id);
      // Leftovers (e.g. shutdown) must not be emailed later by the resume job.
      const abandoned = await this.prisma.communicationRecipient.updateMany({
        where: {
          communicationLogId: log.id,
          status: CommunicationRecipientStatus.queued,
        },
        data: {
          status: CommunicationRecipientStatus.failed,
          error: "The send was interrupted before it finished. Please try again.",
        },
      });
      if (abandoned.count > 0) {
        await this.dispatcher.refreshLogStatus(log.id);
      }
      return this.buildSendResult(log.id, isMock);
    }

    void this.dispatcher.process(log.id).catch((err) =>
      this.logger.error(`Background send ${log.id} failed to start`, err),
    );

    return {
      success: true,
      total: recipients.length,
      successCount: 0,
      failureCount: 0,
      status: CommunicationStatus.queued,
      logId: log.id,
      mock: isMock,
      results: [],
    };
  }

  private async buildSendResult(
    logId: string,
    isMock: boolean,
  ): Promise<SendEmailResult> {
    const log = await this.prisma.communicationLog.findUniqueOrThrow({
      where: { id: logId },
      select: {
        status: true,
        recipientCount: true,
        successCount: true,
        failureCount: true,
        recipients: {
          select: RECIPIENT_RESULT_SELECT,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const results = log.recipients.map(toRecipientResult);
    const pending = results.filter((r) => r.status === "queued").length;
    return {
      success: log.failureCount === 0 && pending === 0,
      total: log.recipientCount,
      successCount: log.successCount,
      failureCount: log.failureCount,
      status: log.status,
      logId,
      mock: isMock,
      results,
    };
  }


  async getHistory(dto: GetCommunicationHistoryDto) {
    const { page, pageSize, search, status } = dto;

    const where: Prisma.CommunicationLogWhereInput = {};

    if (status && status !== "all") {
      where.status = status as CommunicationStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.communicationLog.count({ where }),
      this.prisma.communicationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          staff: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getHistoryById(id: string) {
    const log = await this.prisma.communicationLog.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        recipients: {
          select: RECIPIENT_RESULT_SELECT,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!log) {
      throw new NotFoundException("Communication log not found");
    }

    return { ...log, recipients: log.recipients.map(toRecipientResult) };
  }

  verifyResendWebhook(
    rawBody: Buffer | undefined,
    headers: { id?: string; timestamp?: string; signature?: string },
  ): ResendWebhookEvent {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error("RESEND_WEBHOOK_SECRET is not set; rejecting webhook.");
      throw new UnauthorizedException("Webhook verification is not configured");
    }

    const { id, timestamp, signature } = headers;
    if (!rawBody || !id || !timestamp || !signature) {
      throw new UnauthorizedException("Missing webhook signature");
    }

    let payload: unknown;
    try {
      payload = this.resend.webhooks.verify({
        payload: rawBody.toString("utf8"),
        headers: { id, timestamp, signature },
        webhookSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const parsed = ResendWebhookEventSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException("Malformed webhook payload");
    }
    return parsed.data;
  }

  async handleWebhook(event: ResendWebhookEvent) {
    const emailId = event.data.email_id;
    const eventType = event.type;

    if (!emailId) {
      this.logger.warn("Webhook received without email_id");
      return { ok: false, message: "Missing email_id" };
    }

    this.logger.log(`Received Resend webhook: ${eventType} for email ${emailId}`);

    // Map Resend webhook event types to internal statuses
    let newStatus: "delivered" | "bounced" | "failed" | null = null;
    if (eventType === "email.delivered") {
      newStatus = "delivered";
    } else if (eventType === "email.bounced" || eventType === "email.complained") {
      newStatus = "bounced";
    } else if (eventType === "email.failed") {
      newStatus = "failed";
    } else if (eventType === "email.delivery_delayed") {
      newStatus = null; // Informational
    }

    if (!newStatus) {
      return { ok: true, ignored: true };
    }

    const matches = await this.prisma.communicationRecipient.findMany({
      where: { resendId: emailId },
      select: { communicationLogId: true },
    });

    if (matches.length === 0) {
      this.logger.log(`No communication log found for Resend email ID: ${emailId}`);
      return { ok: true, matched: 0 };
    }

    // A late "delivered" never replaces a bounce or failure.
    await this.prisma.communicationRecipient.updateMany({
      where: {
        resendId: emailId,
        status:
          newStatus === "delivered"
            ? CommunicationRecipientStatus.sent
            : {
                in: [
                  CommunicationRecipientStatus.sent,
                  CommunicationRecipientStatus.delivered,
                ],
              },
      },
      data: {
        status: newStatus,
        ...(newStatus !== "delivered"
          ? { error: `Email was not delivered (${eventType})` }
          : {}),
      },
    });

    const logIds = [...new Set(matches.map((m) => m.communicationLogId))];
    for (const logId of logIds) {
      await this.dispatcher.refreshLogStatus(logId);
    }

    await this.syncReportCardDelivery(logIds, newStatus, eventType);

    return { ok: true, matched: logIds.length };
  }


  private async syncReportCardDelivery(
    communicationLogIds: string[],
    status: "delivered" | "bounced" | "failed",
    eventType: string,
  ) {
    if (status === "delivered") {
      // Never overwrite a bounce with a late/out-of-order delivered event.
      await this.prisma.reportCard.updateMany({
        where: {
          communicationLogId: { in: communicationLogIds },
          lastSendStatus: ReportCardSendStatus.sent,
        },
        data: { lastSendStatus: ReportCardSendStatus.delivered },
      });
      return;
    }

    await this.prisma.reportCard.updateMany({
      where: {
        communicationLogId: { in: communicationLogIds },
        lastSendStatus: {
          in: [ReportCardSendStatus.sent, ReportCardSendStatus.delivered],
        },
      },
      data: {
        lastSendStatus:
          status === "bounced"
            ? ReportCardSendStatus.bounced
            : ReportCardSendStatus.failed,
        lastSendError: `Email was not delivered (${eventType})`,
      },
    });
  }
}
