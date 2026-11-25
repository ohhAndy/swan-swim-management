import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

describe("CommunicationsController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    await seedGuardian(prisma);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe("POST /communications/recipients", () => {
    it("should return a list of recipients", async () => {
      const response = await request(app.getHttpServer())
        .post("/communications/recipients")
        .send({})
        .expect(201);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it.each(["active", "inactive", "all"])(
      "should accept enrollmentStatus=%s",
      async (enrollmentStatus) => {
        const response = await request(app.getHttpServer())
          .post("/communications/recipients")
          .send({ enrollmentStatus })
          .expect(201);

        expect(Array.isArray(response.body)).toBe(true);
      },
    );

    it("should reject an invalid enrollmentStatus", async () => {
      await request(app.getHttpServer())
        .post("/communications/recipients")
        .send({ enrollmentStatus: "bogus" })
        .expect(400);
    });
  });

  // Wait so table cleanup doesn't race the background worker.
  const waitForSend = async (logId: string) => {
    for (let i = 0; i < 50; i++) {
      const log = await prisma.communicationLog.findUnique({ where: { id: logId } });
      if (log && log.status !== "queued" && log.status !== "sending") return log;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Send ${logId} did not finish`);
  };

  describe("POST /communications/send", () => {
    it("queues the send and returns before it is processed", async () => {
      const response = await request(app.getHttpServer())
        .post("/communications/send")
        .send({
          subject: "Test Email",
          body: "Hello World",
          recipients: ["test@example.com"],
        })
        .expect(201);

      expect(response.body.status).toBe("queued");
      expect(response.body.logId).toBeDefined();

      const log = await waitForSend(response.body.logId);
      expect(log.status).toBe("sent");
      expect(log.successCount).toBe(1);
    });

    it("emails each address once and drops the attachment when done", async () => {
      const response = await request(app.getHttpServer())
        .post("/communications/send")
        .send({
          subject: "Notice",
          body: "See attached",
          recipients: ["a@example.com", "A@example.com", "b@example.com"],
          attachments: [
            { filename: "notice.pdf", content: Buffer.from("pdf").toString("base64") },
          ],
        })
        .expect(201);

      expect(response.body.total).toBe(2);
      await waitForSend(response.body.logId);

      const details = await request(app.getHttpServer())
        .get(`/communications/history/${response.body.logId}`)
        .expect(200);
      expect(details.body.attachmentCount).toBe(1);
      expect(details.body.recipients.map((r: { email: string }) => r.email)).toEqual([
        "a@example.com",
        "b@example.com",
      ]);
      expect(
        details.body.recipients.every((r: { status: string }) => r.status === "sent"),
      ).toBe(true);

      const stored = await prisma.communicationAttachment.count({
        where: { communicationLogId: response.body.logId },
      });
      expect(stored).toBe(0);
    });

    it("rejects a send with no recipients", async () => {
      await request(app.getHttpServer())
        .post("/communications/send")
        .send({ subject: "x", body: "y", recipients: [] })
        .expect(400);
    });
  });
});
