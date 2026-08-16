import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  RecipientFilterDto,
  SendEmailDto,
  GetCommunicationHistoryDto,
} from "./dto/communications.dto";
import { CommunicationStatus, Prisma } from "@prisma/client";
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

  constructor(private readonly prisma: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
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
    } = filters;

    const studentWhere: Prisma.StudentWhereInput = {
      guardian: {
        email: { not: "" },
      },
    };

    if (level) {
      studentWhere.level = level;
    }

    const where: Prisma.EnrollmentWhereInput = {
      status: "active",
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
      // Chunk recipients into batches of up to 100 (Resend Batch API limit)
      const BATCH_SIZE = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        chunks.push(recipients.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // If not the first chunk, add a small throttle delay between requests to never exceed 10 req/sec
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        try {
          const batchPayload = chunk.map((recipient) => ({
            from,
            to: recipient,
            subject,
            html: `<div style="white-space: pre-wrap; font-family: sans-serif;">${body}</div>`,
            attachments: attachments?.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, "base64"),
            })),
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
            // Map returned Resend IDs back to recipients in the chunk
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
          const message = err instanceof Error ? err.message : "Batch request failed";
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
      await this.prisma.auditLog.create({
        data: {
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

  async handleWebhook(event: {
    type: string;
    data: {
      email_id?: string;
      to?: string[];
      created_at?: string;
      [key: string]: unknown;
    };
  }) {
    const emailId = event.data?.email_id;
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

    return { ok: true, matched: logs.length };
  }
}
