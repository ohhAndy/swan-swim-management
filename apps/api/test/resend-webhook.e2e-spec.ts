import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createHmac, randomBytes } from "crypto";
import { PrismaService } from "../src/prisma/prisma.service";
import { CommunicationsService } from "../src/communications/communications.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian, seedTerm, seedClassOffering } from "./utils/seeds";

const SECRET_BYTES = randomBytes(24);
const WEBHOOK_SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

function signedHeaders(body: string, secret: Buffer = SECRET_BYTES) {
  const id = `msg_${randomBytes(8).toString("hex")}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", secret)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return {
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`,
    "content-type": "application/json",
  };
}

describe("Resend webhook (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reportCardId: string;
  let logId: string;
  const resendId = "re_test_123";

  beforeAll(async () => {
    process.env.RESEND_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const guardian = await seedGuardian(prisma);
    const student = await prisma.student.create({
      data: { firstName: "Test", lastName: "Student", guardianId: guardian.id },
    });
    const term = await seedTerm(prisma);
    const offering = await seedClassOffering(prisma, term.id);
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        offeringId: offering.id,
        enrollDate: new Date(),
        status: "active",
        classRatio: "3:1",
      },
    });

    const log = await prisma.communicationLog.create({
      data: {
        subject: "Progress Report",
        body: "body",
        status: "sent",
        recipientCount: 1,
        successCount: 1,
        completedAt: new Date(),
        recipients: {
          create: [{ email: guardian.email, status: "sent", resendId }],
        },
      },
    });
    logId = log.id;

    const card = await prisma.reportCard.create({
      data: {
        enrollmentId: enrollment.id,
        status: "sent",
        lastSendStatus: "sent",
        communicationLogId: log.id,
      },
    });
    reportCardId = card.id;
  });

  afterAll(async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    await app.close();
  });

  const post = (body: string, headers: Record<string, string>) =>
    request(app.getHttpServer())
      .post("/communications/webhooks/resend")
      .set("x-mock-unauthorized", "true")
      .set(headers)
      .send(body);

  const event = (type: string) =>
    JSON.stringify({ type, created_at: new Date().toISOString(), data: { email_id: resendId } });

  it("rejects a request without a signature", async () => {
    await post(event("email.bounced"), { "content-type": "application/json" }).expect(401);

    const card = await prisma.reportCard.findUnique({ where: { id: reportCardId } });
    expect(card?.lastSendStatus).toBe("sent");
  });

  it("rejects a request signed with the wrong secret", async () => {
    const body = event("email.bounced");
    await post(body, signedHeaders(body, randomBytes(24))).expect(401);

    const card = await prisma.reportCard.findUnique({ where: { id: reportCardId } });
    expect(card?.lastSendStatus).toBe("sent");
  });

  it("rejects a body that was tampered with after signing", async () => {
    const headers = signedHeaders(event("email.delivered"));
    await post(event("email.bounced"), headers).expect(401);
  });

  it("marks the linked report card as bounced", async () => {
    const body = event("email.bounced");
    await post(body, signedHeaders(body)).expect(201);

    const card = await prisma.reportCard.findUnique({ where: { id: reportCardId } });
    expect(card?.lastSendStatus).toBe("bounced");
    expect(card?.lastSendError).toContain("email.bounced");
  });

  it("marks the linked report card as delivered", async () => {
    const body = event("email.delivered");
    await post(body, signedHeaders(body)).expect(201);

    const card = await prisma.reportCard.findUnique({ where: { id: reportCardId } });
    expect(card?.lastSendStatus).toBe("delivered");
  });

  it("updates the recipient row and the send's overall status", async () => {
    const body = event("email.bounced");
    await post(body, signedHeaders(body)).expect(201);

    const recipient = await prisma.communicationRecipient.findFirst({
      where: { resendId },
    });
    expect(recipient?.status).toBe("bounced");
    const log = await prisma.communicationLog.findUnique({ where: { id: logId } });
    expect(log?.status).toBe("partial");
  });

  it("keeps every status when many webhooks for one send arrive at once", async () => {
    const ids = Array.from({ length: 40 }, (_, i) => `re_bulk_${i}`);
    const bulk = await prisma.communicationLog.create({
      data: {
        subject: "Bulk",
        body: "body",
        status: "sent",
        recipientCount: ids.length,
        successCount: ids.length,
        completedAt: new Date(),
        recipients: {
          create: ids.map((id, i) => ({
            email: `bulk${i}@example.com`,
            status: "sent" as const,
            resendId: id,
          })),
        },
      },
    });

    // Direct calls: 40 parallel supertest connections get reset.
    const service = app.get(CommunicationsService);
    await Promise.all(
      ids.map((id) =>
        service.handleWebhook({
          type: "email.delivered",
          created_at: new Date().toISOString(),
          data: { email_id: id },
        }),
      ),
    );

    const delivered = await prisma.communicationRecipient.count({
      where: { communicationLogId: bulk.id, status: "delivered" },
    });
    expect(delivered).toBe(ids.length);
    const log = await prisma.communicationLog.findUnique({ where: { id: bulk.id } });
    expect(log?.status).toBe("delivered");
  });

  it("does not overwrite a bounce with a late delivered event", async () => {
    const bounced = event("email.bounced");
    await post(bounced, signedHeaders(bounced)).expect(201);
    const delivered = event("email.delivered");
    await post(delivered, signedHeaders(delivered)).expect(201);

    const card = await prisma.reportCard.findUnique({ where: { id: reportCardId } });
    expect(card?.lastSendStatus).toBe("bounced");
  });
});
