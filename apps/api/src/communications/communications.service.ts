import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RecipientFilterDto, SendEmailDto } from "./dto/communications.dto";
import { Prisma } from "@prisma/client";

import { Resend } from "resend";

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

  async sendEmail(dto: SendEmailDto) {
    const { recipients, subject, body, attachments } = dto;

    this.logger.log(`Sending Email to ${recipients.length} recipients`);

    // Check if we have an API key
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(
        "RESEND_API_KEY is not set. Falling back to mock email sending.",
      );
      return { success: true, count: recipients.length, mock: true };
    }

    const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

    try {
      // Resend's free tier only allows sending to 1 recipient at a time if not using a verified domain?
      // Actually batch sending is supported but let's loop to be safe and handle individual failures if needed,
      // or just send as BCC if we want to hide recipients.
      // However, usually "Email Guardians" feature implies individual emails or a bulk send.
      // For now, let's treat `recipients` as a list of "To" addresses.
      // If there are multiple, we should probably BCC them or send individually.
      // Implementation plan didn't specify, but safer to send individually to avoid exposing emails
      // if the user intended a broadcast.
      // BUT current UI is "Email to [Guardian]", so recipients usually has 1 entry.

      // If we have multiple recipients, sending them all in "to" field reveals everyone's email.
      // Let's send individually to be safe and personal.

      const results = await Promise.all(
        recipients.map(async (recipient) => {
          return this.resend.emails.send({
            from,
            to: recipient,
            subject,
            html: `<div style="white-space: pre-wrap; font-family: sans-serif;">${body}</div>`, // Assuming body is HTML safe or simple text. Resend takes 'html' or 'text'.
            attachments: attachments?.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, "base64"),
            })),
          });
        }),
      );

      // Check for errors in results
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        this.logger.error(
          `Failed to send ${errors.length} emails`,
          errors[0].error,
        );
        // We could throw or return partial success. For now, if any fail, we log.
      }

      return {
        success: errors.length === 0,
        count: recipients.length - errors.length,
      };
    } catch (error) {
      this.logger.error("Failed to send email via Resend", error);
      throw error;
    }
  }
}
