import { CommunicationRecipientStatus } from "@prisma/client";
import { createPrismaMock, MockPrismaService } from "../prisma/prisma.mock";
import { PrismaService } from "../prisma/prisma.service";
import { EmailDispatchService } from "./email-dispatch.service";
import { ResendRateLimiter } from "./resend-rate-limiter";

type FakeResponse = {
  data: unknown;
  error: { name: string; message: string; statusCode: number | null } | null;
  headers: Record<string, string> | null;
};

const ok = (data: unknown): FakeResponse => ({ data, error: null, headers: {} });
const fail = (
  name: string,
  statusCode: number,
  headers: Record<string, string> = {},
): FakeResponse => ({
  data: null,
  error: { name, message: `${name} message`, statusCode },
  headers,
});

describe("EmailDispatchService", () => {
  let prisma: MockPrismaService;
  let service: EmailDispatchService;
  let emailsSend: jest.Mock;
  let batchSend: jest.Mock;
  const originalKey = process.env.RESEND_API_KEY;
  const originalRate = process.env.RESEND_MAX_REQUESTS_PER_SECOND;

  const recipients = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `r${String(i).padStart(4, "0")}`,
      email: `guardian${i}@example.com`,
    }));

  const givenSend = (opts: {
    attachments: boolean;
    pending: { id: string; email: string }[];
  }) => {
    prisma.communicationLog.updateMany.mockResolvedValue({ count: 1 });
    prisma.communicationLog.findUnique.mockResolvedValue({
      subject: "Pool closure",
      body: "The pool is closed on Monday.",
      attachments: opts.attachments
        ? [{ filename: "notice.pdf", content: Buffer.from("pdf") }]
        : [],
    });
    prisma.communicationRecipient.findMany.mockResolvedValue(opts.pending);
    prisma.communicationRecipient.count.mockResolvedValue(0);
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_MAX_REQUESTS_PER_SECOND = "1000";

    prisma = createPrismaMock();
    // The shared mock only supports the callback form.
    prisma.$transaction.mockImplementation(
      async (arg: unknown[] | ((tx: unknown) => Promise<unknown>)) =>
        Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
    );
    service = new EmailDispatchService(
      prisma as unknown as PrismaService,
      new ResendRateLimiter(),
    );

    emailsSend = jest.fn();
    batchSend = jest.fn();
    (service as unknown as { resend: unknown }).resend = {
      emails: { send: emailsSend },
      batch: { send: batchSend },
    };
    jest.spyOn(service, "refreshLogStatus").mockResolvedValue();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    process.env.RESEND_MAX_REQUESTS_PER_SECOND = originalRate;
    jest.restoreAllMocks();
  });

  it("retries a rate-limited attachment email with the same idempotency key", async () => {
    givenSend({ attachments: true, pending: recipients(1) });
    emailsSend
      .mockResolvedValueOnce(
        fail("rate_limit_exceeded", 429, { "retry-after": "0" }),
      )
      .mockResolvedValueOnce(ok({ id: "re_1" }));

    await service.process("log1");

    expect(emailsSend).toHaveBeenCalledTimes(2);
    for (const call of emailsSend.mock.calls) {
      expect(call[1]).toEqual({ idempotencyKey: "comm-r0000" });
      expect(call[0].attachments).toHaveLength(1);
    }
    expect(prisma.communicationRecipient.update).toHaveBeenCalledWith({
      where: { id: "r0000" },
      data: expect.objectContaining({
        status: CommunicationRecipientStatus.sent,
        resendId: "re_1",
        attempts: { increment: 2 },
      }),
    });
    expect(prisma.communicationAttachment.deleteMany).toHaveBeenCalledWith({
      where: { communicationLogId: "log1" },
    });
  });

  it("does not retry an email Resend rejects as invalid", async () => {
    givenSend({ attachments: true, pending: recipients(1) });
    emailsSend.mockResolvedValue(fail("validation_error", 422));

    await service.process("log1");

    expect(emailsSend).toHaveBeenCalledTimes(1);
    expect(prisma.communicationRecipient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["r0000"] } },
      data: expect.objectContaining({
        status: CommunicationRecipientStatus.failed,
        error: "validation_error message",
      }),
    });
  });

  it("stops the whole send when the monthly quota is used up", async () => {
    givenSend({ attachments: true, pending: recipients(50) });
    emailsSend.mockResolvedValue(fail("monthly_quota_exceeded", 429));

    await service.process("log1");

    expect(emailsSend.mock.calls.length).toBeLessThanOrEqual(4);
    expect(prisma.communicationRecipient.updateMany).toHaveBeenCalledWith({
      where: {
        communicationLogId: "log1",
        status: CommunicationRecipientStatus.queued,
      },
      data: {
        status: CommunicationRecipientStatus.failed,
        error: "monthly_quota_exceeded message",
      },
    });
  });

  it("sends emails without attachments through the batch endpoint in groups of 100", async () => {
    const pending = recipients(150);
    givenSend({ attachments: false, pending });
    batchSend.mockImplementation(async (emails: unknown[]) =>
      ok({ data: emails.map((_, i) => ({ id: `re_${i}` })) }),
    );

    await service.process("log1");

    expect(emailsSend).not.toHaveBeenCalled();
    expect(batchSend).toHaveBeenCalledTimes(2);
    expect(batchSend.mock.calls[0][0]).toHaveLength(100);
    expect(batchSend.mock.calls[1][0]).toHaveLength(50);
    expect(batchSend.mock.calls[0][1].idempotencyKey).toMatch(/^comm-batch-/);
    expect(batchSend.mock.calls[0][1].idempotencyKey).not.toEqual(
      batchSend.mock.calls[1][1].idempotencyKey,
    );
    expect(prisma.communicationRecipient.update).toHaveBeenCalledTimes(150);
  });

  it("uses the same batch idempotency key when a send is resumed", async () => {
    const pending = recipients(3);
    givenSend({ attachments: false, pending });
    batchSend.mockResolvedValue(
      ok({ data: pending.map((_, i) => ({ id: `re_${i}` })) }),
    );

    await service.process("log1");
    await service.process("log1");

    expect(batchSend).toHaveBeenCalledTimes(2);
    expect(batchSend.mock.calls[0][1]).toEqual(batchSend.mock.calls[1][1]);
  });

  it("marks a batch failed after a server error keeps happening", async () => {
    givenSend({ attachments: false, pending: recipients(2) });
    batchSend.mockResolvedValue(
      fail("internal_server_error", 500, { "retry-after": "0" }),
    );

    await service.process("log1");

    expect(batchSend).toHaveBeenCalledTimes(5);
    expect(prisma.communicationRecipient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["r0000", "r0001"] } },
      data: expect.objectContaining({
        status: CommunicationRecipientStatus.failed,
        attempts: { increment: 5 },
      }),
    });
  });

  it("does nothing when another worker already holds the send", async () => {
    givenSend({ attachments: true, pending: recipients(2) });
    prisma.communicationLog.updateMany.mockResolvedValue({ count: 0 });

    await service.process("log1");

    expect(emailsSend).not.toHaveBeenCalled();
    expect(prisma.communicationRecipient.findMany).not.toHaveBeenCalled();
  });

  it("marks recipients sent without calling Resend when no API key is set", async () => {
    process.env.RESEND_API_KEY = "";
    givenSend({ attachments: true, pending: recipients(2) });

    await service.process("log1");

    expect(emailsSend).not.toHaveBeenCalled();
    expect(prisma.communicationRecipient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["r0000", "r0001"] } },
      data: {
        status: CommunicationRecipientStatus.sent,
        attempts: { increment: 1 },
      },
    });
  });
});
