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
  CommunicationStatus,
  Prisma,
  ReportCardSendStatus,
} from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";
import { Resend } from "resend";

export interface RecipientSendResult {
  email: string;
  status: "sent" | "failed" | "delivered" | "bounced";
  resendId?: string;
  error?: string;
  updatedAt: string;
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {
    // The Resend SDK throws on a missing key, which would stop the whole app
    // from booting (e.g. in tests, where the key is blanked on purpose).
    // Sending already falls back to mock mode without a real key, and webhook
    // verification never calls the API, so a placeholder is safe here.
    this.resend = new Resend(
      process.env.RESEND_API_KEY || "re_not_configured",
    );
  }

  async getRecipients(filters: RecipientFilterDto) {
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

    // Filter by Location/Term via Offering
    if (
      locationId ||
      termId ||
      dayOfWeek ||
      startTime ||
      endTime ||
      instructorId
    ) {
      where.offering = {
        ...(dayOfWeek !== undefined ? { weekday: dayOfWeek } : {}),
        ...(startTime ? { startTime: { gte: startTime } } : {}),
        ...(endTime ? { endTime: { lte: endTime } } : {}),
        term: {
          ...(termId ? { id: termId } : {}),
          ...(locationId ? { locationId } : {}),
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
    }

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

  async sendEmail(dto: SendEmailDto, staffUser?: RequestStaffUser) {
    const { recipients, subject, body, attachments } = dto;

    this.logger.log(`Sending Email to ${recipients.length} recipients`);

    const isMock = !process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const recipientResults: RecipientSendResult[] = [];

    if (isMock) {
      this.logger.warn(
        "RESEND_API_KEY is not set. Falling back to mock email sending.",
      );

      for (const recipient of recipients) {
        recipientResults.push({
          email: recipient,
          status: "sent",
          resendId: `mock_${Math.random().toString(36).substring(2, 10)}`,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      const hasAttachments = attachments && attachments.length > 0;

      if (hasAttachments) {
        // Resend Batch API does NOT support attachments.
        // Send individually via resend.emails.send in throttled sub-batches (5 concurrent at a time) to stay safely under 10 req/sec.
        const SUB_BATCH_SIZE = 5;
        const subBatches: string[][] = [];
        for (let i = 0; i < recipients.length; i += SUB_BATCH_SIZE) {
          subBatches.push(recipients.slice(i, i + SUB_BATCH_SIZE));
        }

        for (let i = 0; i < subBatches.length; i++) {
          const subBatch = subBatches[i];

          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          const results = await Promise.all(
            subBatch.map(async (recipient) => {
              try {
                const res = await this.resend.emails.send({
                  from,
                  to: recipient,
                  subject,
                  html: `<div style="white-space: pre-wrap; font-family: sans-serif;">${body}</div>`,
                  attachments: attachments.map((a) => ({
                    filename: a.filename,
                    content: Buffer.from(a.content, "base64"),
                  })),
                });

                if (res.error) {
                  return {
                    email: recipient,
                    status: "failed" as const,
                    error: res.error.message || JSON.stringify(res.error),
                    updatedAt: new Date().toISOString(),
                  };
                }

                return {
                  email: recipient,
                  status: "sent" as const,
                  resendId: res.data?.id,
                  updatedAt: new Date().toISOString(),
                };
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Unknown send failure";
                return {
                  email: recipient,
                  status: "failed" as const,
                  error: message,
                  updatedAt: new Date().toISOString(),
                };
              }
            }),
          );

          recipientResults.push(...results);
        }
      } else {
        // No attachments: use Resend Batch API in chunks of up to 100
        const BATCH_SIZE = 100;
        const chunks: string[][] = [];
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
          chunks.push(recipients.slice(i, i + BATCH_SIZE));
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          try {
            const batchPayload = chunk.map((recipient) => ({
              from,
              to: recipient,
              subject,
              html: `<div style="white-space: pre-wrap; font-family: sans-serif;">${body}</div>`,
            }));

            const res = await this.resend.batch.send(batchPayload);

            if (res.error) {
              this.logger.error(`Batch send error for chunk ${i}:`, res.error);
              for (const recipient of chunk) {
                recipientResults.push({
                  email: recipient,
                  status: "failed",
                  error: res.error.message || JSON.stringify(res.error),
                  updatedAt: new Date().toISOString(),
                });
              }
            } else if (res.data?.data) {
              const responseList = res.data.data;
              for (let j = 0; j < chunk.length; j++) {
                const recipient = chunk[j];
                const item = responseList[j];
                recipientResults.push({
                  email: recipient,
                  status: "sent",
                  resendId: item?.id,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Batch request failed";
            this.logger.error(`Exception during batch send for chunk ${i}:`, err);
            for (const recipient of chunk) {
              recipientResults.push({
                email: recipient,
                status: "failed",
                error: message,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    const successCount = recipientResults.filter((r) => r.status === "sent").length;
    const failureCount = recipientResults.length - successCount;

    let overallStatus: CommunicationStatus = CommunicationStatus.sent;
    if (successCount === 0 && recipientResults.length > 0) {
      overallStatus = CommunicationStatus.failed;
    } else if (failureCount > 0) {
      overallStatus = CommunicationStatus.partial;
    }

    // Record in CommunicationLog table
    const log = await this.prisma.communicationLog.create({
      data: {
        staffId: staffUser?.id ?? null,
        subject,
        body,
        status: overallStatus,
        recipientCount: recipients.length,
        successCount,
        failureCount,
        attachmentCount: attachments?.length || 0,
        recipients: recipientResults as unknown as Prisma.InputJsonValue,
      },
    });

    // Also record in AuditLog
    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "Send Email",
        entityType: "Communication",
        entityId: log.id,
        metadata: {
          subject,
          recipientCount: recipients.length,
          successCount,
          failureCount,
          status: overallStatus,
          mock: isMock,
        },
      });
    }

    return {
      success: failureCount === 0,
      total: recipients.length,
      successCount,
      failureCount,
      status: overallStatus,
      logId: log.id,
      mock: isMock,
      results: recipientResults,
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
      },
    });

    if (!log) {
      throw new NotFoundException("Communication log not found");
    }

    return log;
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

    // Find communication log that contains this resendId in recipients
    const logs = await this.prisma.communicationLog.findMany({
      where: {
        recipients: {
          array_contains: [{ resendId: emailId }],
        },
      },
    });

    if (logs.length === 0) {
      this.logger.log(`No communication log found for Resend email ID: ${emailId}`);
      return { ok: true, matched: 0 };
    }

    for (const log of logs) {
      const rawRecipients = (log.recipients as unknown as RecipientSendResult[]) || [];
      let modified = false;

      const updatedRecipients = rawRecipients.map((r) => {
        if (r.resendId === emailId) {
          modified = true;
          return {
            ...r,
            status: newStatus!,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      });

      if (modified) {
        // Recalculate overall status
        const allDelivered = updatedRecipients.every(
          (r) => r.status === "delivered",
        );
        const hasBounced = updatedRecipients.some((r) => r.status === "bounced" || r.status === "failed");

        let updatedOverall = log.status;
        if (allDelivered) {
          updatedOverall = CommunicationStatus.delivered;
        } else if (hasBounced && log.status === CommunicationStatus.sent) {
          updatedOverall = CommunicationStatus.partial;
        }

        await this.prisma.communicationLog.update({
          where: { id: log.id },
          data: {
            status: updatedOverall,
            recipients: updatedRecipients as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    await this.syncReportCardDelivery(
      logs.map((l) => l.id),
      newStatus,
      eventType,
    );

    return { ok: true, matched: logs.length };
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
