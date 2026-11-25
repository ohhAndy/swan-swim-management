import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { createHash } from "crypto";
import {
  CommunicationRecipientStatus,
  CommunicationStatus,
} from "@prisma/client";
import { Resend, type ErrorResponse } from "resend";
import { PrismaService } from "../prisma/prisma.service";
import { ResendRateLimiter, sleep } from "./resend-rate-limiter";

const LEASE_MS = 2 * 60_000;
const HEARTBEAT_MS = 5_000;
const UNCLAIMED_GRACE_MS = 15_000;
const RESUME_BATCH = 5;

const MAX_ATTEMPTS = 5;
const MAX_RETRY_WAIT_MS = 60_000;
// Resend's batch endpoint takes up to 100 emails but no attachments.
const BATCH_SIZE = 100;
const ATTACHMENT_CONCURRENCY = 4;
const SHUTDOWN_WAIT_MS = 10_000;

// These fail every remaining recipient the same way, so the send stops early.
const FATAL_ERRORS = new Set<ErrorResponse["name"]>([
  "monthly_quota_exceeded",
  "daily_quota_exceeded",
  "missing_api_key",
  "invalid_api_key",
  "restricted_api_key",
  "invalid_from_address",
]);

const RETRYABLE_ERRORS = new Set<ErrorResponse["name"]>([
  "rate_limit_exceeded",
  "concurrent_idempotent_requests",
  "application_error",
  "internal_server_error",
]);

type ResendResponse<T> = {
  data: T | null;
  error: ErrorResponse | null;
  headers: Record<string, string> | null;
};

type CallResult<T> =
  | { kind: "sent"; data: T; attempts: number }
  | { kind: "failed"; error: string; fatal: boolean; attempts: number };

interface PendingRecipient {
  id: string;
  email: string;
}

interface SendContext {
  logId: string;
  from: string;
  subject: string;
  html: string;
  attachments: { filename: string; content: Buffer }[];
  abortReason: string | null;
}

export function renderEmailHtml(body: string): string {
  return `<div style="white-space: pre-wrap; font-family: sans-serif;">${body}</div>`;
}

/**
 * Background sender. A lease on the log row keeps each send to one worker;
 * idempotency keys from recipient ids make resumed or retried requests safe.
 */
@Injectable()
export class EmailDispatchService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailDispatchService.name);
  private readonly resend: Resend;
  private readonly active = new Map<string, Promise<void>>();
  private stopping = false;
  private resuming = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: ResendRateLimiter,
  ) {
    // The SDK throws on a missing key; mock mode handles that case.
    this.resend = new Resend(
      process.env.RESEND_API_KEY || "re_not_configured",
    );
  }

  get isMock(): boolean {
    return !process.env.RESEND_API_KEY;
  }

  process(logId: string): Promise<void> {
    const running = this.active.get(logId);
    if (running) return running;

    const run = this.run(logId).finally(() => this.active.delete(logId));
    this.active.set(logId, run);
    return run;
  }

  @Interval(30_000)
  async resumeStalledSends(): Promise<void> {
    if (this.resuming || this.stopping) return;
    this.resuming = true;
    try {
      const now = new Date();
      const stalled = await this.prisma.communicationLog.findMany({
        where: {
          status: {
            in: [CommunicationStatus.queued, CommunicationStatus.sending],
          },
          OR: [
            {
              lockedUntil: null,
              createdAt: { lt: new Date(now.getTime() - UNCLAIMED_GRACE_MS) },
            },
            { lockedUntil: { lt: now } },
          ],
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: RESUME_BATCH,
      });

      for (const { id } of stalled) {
        if (this.stopping) break;
        this.logger.warn(`Resuming stalled email send ${id}`);
        await this.process(id);
      }
    } catch (err) {
      this.logger.error("Failed to resume stalled email sends", err);
    } finally {
      this.resuming = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    const running = [...this.active.values()];
    if (running.length === 0) return;
    await Promise.race([Promise.allSettled(running), sleep(SHUTDOWN_WAIT_MS)]);
  }

  // The row lock serialises concurrent webhook and worker updates.
  async refreshLogStatus(logId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        Array<{ status: CommunicationStatus; completedAt: Date | null }>
      >`SELECT "status", "completedAt" FROM "communication_logs" WHERE "id" = ${logId} FOR UPDATE`;
      const current = locked[0];
      if (!current) return;

      const groups = await tx.communicationRecipient.groupBy({
        by: ["status"],
        where: { communicationLogId: logId },
        _count: { _all: true },
      });
      const count = (status: CommunicationRecipientStatus) =>
        groups.find((g) => g.status === status)?._count._all ?? 0;

      const queued = count(CommunicationRecipientStatus.queued);
      const sent = count(CommunicationRecipientStatus.sent);
      const delivered = count(CommunicationRecipientStatus.delivered);
      const bounced = count(CommunicationRecipientStatus.bounced);
      const failed = count(CommunicationRecipientStatus.failed);
      const total = queued + sent + delivered + bounced + failed;
      // Success means Resend accepted it; bounces still make the send partial.
      const accepted = sent + delivered + bounced;

      let status: CommunicationStatus;
      if (queued > 0) {
        status =
          current.status === CommunicationStatus.queued &&
          accepted + failed === 0
            ? CommunicationStatus.queued
            : CommunicationStatus.sending;
      } else if (total === 0) {
        status = CommunicationStatus.sent;
      } else if (accepted === 0) {
        status = CommunicationStatus.failed;
      } else if (delivered === total) {
        status = CommunicationStatus.delivered;
      } else if (failed > 0 || bounced > 0) {
        status = CommunicationStatus.partial;
      } else {
        status = CommunicationStatus.sent;
      }

      const finished = queued === 0;
      await tx.communicationLog.update({
        where: { id: logId },
        data: {
          status,
          successCount: accepted,
          failureCount: failed,
          ...(finished
            ? {
                completedAt: current.completedAt ?? new Date(),
                lockedUntil: null,
              }
            : {}),
        },
      });
    });
  }

  private async run(logId: string): Promise<void> {
    const claimed = await this.prisma.communicationLog.updateMany({
      where: {
        id: logId,
        status: {
          in: [CommunicationStatus.queued, CommunicationStatus.sending],
        },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
      },
      data: {
        status: CommunicationStatus.sending,
        lockedUntil: new Date(Date.now() + LEASE_MS),
      },
    });
    if (claimed.count === 0) return;

    let beating = false;
    const heartbeat = setInterval(() => {
      if (beating) return;
      beating = true;
      this.heartbeat(logId)
        .catch((err) =>
          this.logger.warn(`Heartbeat failed for send ${logId}: ${String(err)}`),
        )
        .finally(() => {
          beating = false;
        });
    }, HEARTBEAT_MS);

    try {
      await this.sendQueuedRecipients(logId);
      await this.refreshLogStatus(logId);
      await this.cleanUpIfFinished(logId);
    } catch (err) {
      this.logger.error(`Email send ${logId} stopped early`, err);
    } finally {
      clearInterval(heartbeat);
      await this.releaseLeaseIfUnfinished(logId);
    }
  }

  private async releaseLeaseIfUnfinished(logId: string): Promise<void> {
    try {
      await this.prisma.communicationLog.updateMany({
        where: {
          id: logId,
          status: {
            in: [CommunicationStatus.queued, CommunicationStatus.sending],
          },
        },
        data: { lockedUntil: new Date() },
      });
    } catch (err) {
      this.logger.warn(
        `Could not release the lease on send ${logId}; it resumes when the lease expires. ${String(err)}`,
      );
    }
  }

  private async heartbeat(logId: string): Promise<void> {
    await this.prisma.communicationLog.updateMany({
      where: { id: logId, status: CommunicationStatus.sending },
      data: { lockedUntil: new Date(Date.now() + LEASE_MS) },
    });
    await this.refreshLogStatus(logId);
  }

  private async cleanUpIfFinished(logId: string): Promise<void> {
    const queued = await this.prisma.communicationRecipient.count({
      where: {
        communicationLogId: logId,
        status: CommunicationRecipientStatus.queued,
      },
    });
    if (queued > 0) return;

    await this.prisma.communicationAttachment.deleteMany({
      where: { communicationLogId: logId },
    });
  }

  private async sendQueuedRecipients(logId: string): Promise<void> {
    const log = await this.prisma.communicationLog.findUnique({
      where: { id: logId },
      select: {
        subject: true,
        body: true,
        attachments: {
          select: { filename: true, content: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!log) return;

    // Stable order keeps batch idempotency keys the same after a restart.
    const pending = await this.prisma.communicationRecipient.findMany({
      where: {
        communicationLogId: logId,
        status: CommunicationRecipientStatus.queued,
      },
      select: { id: true, email: true },
      orderBy: { id: "asc" },
    });
    if (pending.length === 0) return;

    this.logger.log(
      `Sending email ${logId} to ${pending.length} queued recipient(s)`,
    );

    if (this.isMock) {
      this.logger.warn(
        "RESEND_API_KEY is not set. Marking recipients as sent without emailing them.",
      );
      await this.prisma.communicationRecipient.updateMany({
        where: { id: { in: pending.map((r) => r.id) } },
        data: {
          status: CommunicationRecipientStatus.sent,
          attempts: { increment: 1 },
        },
      });
      return;
    }

    const ctx: SendContext = {
      logId,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      subject: log.subject,
      html: renderEmailHtml(log.body),
      attachments: log.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
      })),
      abortReason: null,
    };

    if (ctx.attachments.length > 0) {
      await this.sendIndividually(ctx, pending);
    } else {
      await this.sendInBatches(ctx, pending);
    }

    if (ctx.abortReason) {
      await this.prisma.communicationRecipient.updateMany({
        where: {
          communicationLogId: logId,
          status: CommunicationRecipientStatus.queued,
        },
        data: {
          status: CommunicationRecipientStatus.failed,
          error: ctx.abortReason,
        },
      });
    }
  }

  private async sendIndividually(
    ctx: SendContext,
    recipients: PendingRecipient[],
  ): Promise<void> {
    let next = 0;

    const worker = async () => {
      while (!ctx.abortReason && !this.stopping) {
        const recipient = recipients[next++];
        if (!recipient) return;

        const result = await this.callResend(() =>
          this.resend.emails.send(
            {
              from: ctx.from,
              to: recipient.email,
              subject: ctx.subject,
              html: ctx.html,
              attachments: ctx.attachments,
            },
            { idempotencyKey: `comm-${recipient.id}` },
          ),
        );

        if (result.kind === "sent") {
          await this.markSent(recipient.id, result.data.id, result.attempts);
        } else {
          if (result.fatal) ctx.abortReason = result.error;
          await this.markFailed([recipient.id], result.error, result.attempts);
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(ATTACHMENT_CONCURRENCY, recipients.length) },
        () => worker(),
      ),
    );
  }

  private async sendInBatches(
    ctx: SendContext,
    recipients: PendingRecipient[],
  ): Promise<void> {
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      if (ctx.abortReason || this.stopping) return;

      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const idempotencyKey = `comm-batch-${createHash("sha256")
        .update(chunk.map((r) => r.id).join(","))
        .digest("hex")
        .slice(0, 48)}`;

      const result = await this.callResend(() =>
        this.resend.batch.send(
          chunk.map((r) => ({
            from: ctx.from,
            to: r.email,
            subject: ctx.subject,
            html: ctx.html,
          })),
          { idempotencyKey },
        ),
      );

      if (result.kind === "failed") {
        if (result.fatal) ctx.abortReason = result.error;
        await this.markFailed(
          chunk.map((r) => r.id),
          result.error,
          result.attempts,
        );
        continue;
      }

      const ids = result.data.data;
      await this.prisma.$transaction(
        chunk.map((r, j) =>
          this.prisma.communicationRecipient.update({
            where: { id: r.id },
            data: {
              status: CommunicationRecipientStatus.sent,
              resendId: ids[j]?.id ?? null,
              error: null,
              attempts: { increment: result.attempts },
            },
          }),
        ),
      );
    }
  }

  private async markSent(id: string, resendId: string, attempts: number) {
    await this.prisma.communicationRecipient.update({
      where: { id },
      data: {
        status: CommunicationRecipientStatus.sent,
        resendId,
        error: null,
        attempts: { increment: attempts },
      },
    });
  }

  private async markFailed(ids: string[], error: string, attempts: number) {
    await this.prisma.communicationRecipient.updateMany({
      where: { id: { in: ids } },
      data: {
        status: CommunicationRecipientStatus.failed,
        error,
        attempts: { increment: attempts },
      },
    });
  }

  private async callResend<T>(
    request: () => Promise<ResendResponse<T>>,
  ): Promise<CallResult<T>> {
    let lastError = "Unknown send failure";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await this.limiter.acquire();

      let response: ResendResponse<T> | null = null;
      let retryable = true;
      try {
        response = await request();
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      if (response) {
        if (!response.error && response.data) {
          return { kind: "sent", data: response.data, attempts: attempt };
        }

        const error = response.error;
        lastError = error?.message || "The email provider returned no result";
        if (error && FATAL_ERRORS.has(error.name)) {
          return {
            kind: "failed",
            error: lastError,
            fatal: true,
            attempts: attempt,
          };
        }
        retryable =
          !error ||
          RETRYABLE_ERRORS.has(error.name) ||
          error.statusCode === null ||
          error.statusCode >= 500;

        if (retryable && attempt < MAX_ATTEMPTS) {
          const waitMs =
            retryAfterMs(response.headers) ?? backoffMs(attempt);
          if (error?.name === "rate_limit_exceeded") {
            this.limiter.pauseFor(waitMs);
          }
          this.logger.warn(
            `Resend request failed (${error?.name ?? "no result"}), retrying in ${waitMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`,
          );
          await sleep(waitMs);
          continue;
        }
      } else if (attempt < MAX_ATTEMPTS) {
        const waitMs = backoffMs(attempt);
        this.logger.warn(
          `Resend request threw (${lastError}), retrying in ${waitMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`,
        );
        await sleep(waitMs);
        continue;
      }

      return {
        kind: "failed",
        error: lastError,
        fatal: false,
        attempts: attempt,
      };
    }

    return {
      kind: "failed",
      error: lastError,
      fatal: false,
      attempts: MAX_ATTEMPTS,
    };
  }
}

function retryAfterMs(headers: Record<string, string> | null): number | null {
  const value = headers?.["retry-after"];
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(Math.ceil(seconds * 1000), MAX_RETRY_WAIT_MS);
}

function backoffMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** (attempt - 1), 30_000);
  return base + Math.floor(Math.random() * 250);
}
