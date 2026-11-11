import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestApp } from "./utils/test-setup";
import { seedAdmin, seedGuardian } from "./utils/seeds";

const DAY = 86400000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe("Swim team (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seasonId: string;
  let studentId: string;
  let guardianId: string;
  let offeringIds: string[];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  beforeEach(async () => {
    await seedAdmin(prisma);
    const guardian = await seedGuardian(prisma);
    guardianId = guardian.id;
    const student = await prisma.student.create({
      data: { firstName: "Sam", lastName: "Swimmer", guardianId },
    });
    studentId = student.id;

    // A season that started last month and runs most of a year
    const start = new Date(Date.now() - 30 * DAY);
    const end = new Date(Date.now() + 270 * DAY);
    const season = await request(app.getHttpServer())
      .post("/terms")
      .send({
        name: "Swim Team Season",
        type: "swim_team_season",
        startDate: ymd(start),
        endDate: ymd(end),
        feeTiers: [
          { frequency: 1, practiceFee: 900, meetFee: 0 },
          { frequency: 2, practiceFee: 1600, meetFee: 100 },
          { frequency: 3, practiceFee: 2100, meetFee: 425 },
          { frequency: 4, practiceFee: 2400, meetFee: 425 },
        ],
      })
      .expect(201);
    seasonId = season.body.id;

    offeringIds = [];
    for (const weekday of [1, 3, 5]) {
      const res = await request(app.getHttpServer())
        .post("/offerings")
        .send({
          termId: seasonId,
          type: "swim_team",
          weekday,
          startTime: "17:00",
          duration: 60,
          title: "Junior Squad",
          capacity: 2,
        })
        .expect(201);
      offeringIds.push(res.body.id);
    }
  });

  const register = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post("/swim-team/registrations").send(body);

  describe("season setup", () => {
    it("stores the fee tiers and lets an admin edit them", async () => {
      const fees = await request(app.getHttpServer())
        .get(`/swim-team/seasons/${seasonId}/fees`)
        .expect(200);
      expect(fees.body).toHaveLength(4);
      expect(fees.body[1]).toMatchObject({
        frequency: 2,
        practiceFee: 1600,
        meetFee: 100,
      });

      const updated = await request(app.getHttpServer())
        .put(`/swim-team/seasons/${seasonId}/fees`)
        .send({ tiers: [{ frequency: 2, practiceFee: 1700, meetFee: 120 }] })
        .expect(200);
      expect(updated.body[1]).toMatchObject({ practiceFee: 1700, meetFee: 120 });
      // Untouched tiers keep their values
      expect(updated.body[2]).toMatchObject({ practiceFee: 2100, meetFee: 425 });
    });

    it("generates a practice every week until the season ends", async () => {
      const sessions = await prisma.classSession.count({
        where: { offeringId: offeringIds[0] },
      });
      expect(sessions).toBeGreaterThan(35);
    });

    it("keeps lessons and practices in their own kind of term", async () => {
      await request(app.getHttpServer())
        .post("/offerings")
        .send({
          termId: seasonId,
          weekday: 2,
          startTime: "16:00",
          title: "Preschool A",
          capacity: 3,
        })
        .expect(400);

      const lessonTerm = await prisma.term.create({
        data: {
          name: "Fall",
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * DAY),
        },
      });
      await request(app.getHttpServer())
        .post("/offerings")
        .send({
          termId: lessonTerm.id,
          type: "swim_team",
          weekday: 2,
          startTime: "16:00",
          title: "Squad",
          capacity: 10,
        })
        .expect(400);
    });
  });

  describe("registration", () => {
    it("requires exactly one slot per weekly practice", async () => {
      await register({
        studentId,
        termId: seasonId,
        frequency: 2,
        competing: false,
        offeringIds: [offeringIds[0]],
      }).expect(400);
    });

    it("creates one enrollment per picked slot", async () => {
      const res = await register({
        studentId,
        termId: seasonId,
        frequency: 3,
        competing: true,
        offeringIds,
      }).expect(201);

      expect(res.body).toMatchObject({
        frequency: 3,
        competing: true,
        status: "active",
      });
      expect(res.body.slots).toHaveLength(3);
      expect(res.body.standing.state).toBe("not_invoiced");

      const enrollments = await prisma.enrollment.findMany({
        where: { swimTeamRegistrationId: res.body.id, status: "active" },
      });
      expect(enrollments).toHaveLength(3);
    });

    it("refuses a second registration in the same season", async () => {
      const body = {
        studentId,
        termId: seasonId,
        frequency: 1,
        competing: false,
        offeringIds: [offeringIds[0]],
      };
      await register(body).expect(201);
      await register(body).expect(400);
    });

    it("refuses a full practice slot", async () => {
      for (const name of ["A", "B"]) {
        const other = await prisma.student.create({
          data: { firstName: name, lastName: "Other", guardianId },
        });
        await register({
          studentId: other.id,
          termId: seasonId,
          frequency: 1,
          competing: false,
          offeringIds: [offeringIds[0]],
        }).expect(201);
      }
      await register({
        studentId,
        termId: seasonId,
        frequency: 1,
        competing: false,
        offeringIds: [offeringIds[0]],
      }).expect(400);
    });

    it("changes tier and slots, and suggests an adjusted fee", async () => {
      const created = await register({
        studentId,
        termId: seasonId,
        frequency: 1,
        competing: false,
        offeringIds: [offeringIds[0]],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/swim-team/registrations/${created.body.id}`)
        .send({
          frequency: 2,
          competing: true,
          offeringIds: [offeringIds[1], offeringIds[2]],
        })
        .expect(200);

      expect(res.body.registration.frequency).toBe(2);
      expect(
        res.body.registration.slots.map(
          (s: { offeringId: string }) => s.offeringId,
        ),
      ).toEqual([offeringIds[1], offeringIds[2]]);
      expect(res.body.feeSuggestion.meetFee).toBe(100);
      expect(res.body.feeSuggestion.practiceFee).toBeGreaterThan(0);

      // The dropped slot had no attendance, so it is removed outright
      const dropped = await prisma.enrollment.count({
        where: { studentId, offeringId: offeringIds[0] },
      });
      expect(dropped).toBe(0);
    });

    it("rejects a tier change that does not match the slot count", async () => {
      const created = await register({
        studentId,
        termId: seasonId,
        frequency: 1,
        competing: false,
        offeringIds: [offeringIds[0]],
      }).expect(201);

      await request(app.getHttpServer())
        .patch(`/swim-team/registrations/${created.body.id}`)
        .send({ frequency: 2 })
        .expect(400);
    });

    it("withdraws a swimmer from every slot", async () => {
      const created = await register({
        studentId,
        termId: seasonId,
        frequency: 2,
        competing: false,
        offeringIds: [offeringIds[0], offeringIds[1]],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .post(`/swim-team/registrations/${created.body.id}/withdraw`)
        .expect(201);
      expect(res.body.status).toBe("inactive");

      const active = await prisma.enrollment.count({
        where: { swimTeamRegistrationId: created.body.id, status: "active" },
      });
      expect(active).toBe(0);
    });

    it("keeps lesson-only actions off practice slots", async () => {
      await request(app.getHttpServer())
        .post("/enrollments/with-skip")
        .send({
          studentId,
          offeringId: offeringIds[0],
          skippedDates: [],
          classRatio: "3:1",
        })
        .expect(400);
    });
  });

  describe("invoicing and check-in", () => {
    let registrationId: string;
    let enrollmentId: string;
    let sessionId: string;

    beforeEach(async () => {
      const created = await register({
        studentId,
        termId: seasonId,
        frequency: 2,
        competing: true,
        offeringIds: [offeringIds[0], offeringIds[1]],
      }).expect(201);
      registrationId = created.body.id;
      enrollmentId = created.body.slots[0].enrollmentId;

      const session = await prisma.classSession.findFirstOrThrow({
        where: { offeringId: created.body.slots[0].offeringId },
        orderBy: { date: "asc" },
      });
      sessionId = session.id;
    });

    const invoiceBody = (installments?: { dueDate: string; amount: number }[]) => ({
      guardianId,
      totalAmount: 1700,
      lineItems: [
        {
          swimTeamRegistrationId: registrationId,
          feeType: "swim_team_practice",
          description: "Practice fee",
          amount: 1600,
        },
        {
          swimTeamRegistrationId: registrationId,
          feeType: "swim_team_meet",
          description: "Meet fee",
          amount: 100,
        },
      ],
      installments,
    });

    const checkIn = (extra: Record<string, unknown> = {}) =>
      request(app.getHttpServer())
        .put("/attendance")
        .send({
          enrollmentId,
          classSessionId: sessionId,
          status: "present",
          ...extra,
        });

    it("lists the registration as uninvoiced with suggested fees, not its slots", async () => {
      const registrations = await request(app.getHttpServer())
        .get(`/swim-team/registrations/uninvoiced?guardianId=${guardianId}`)
        .expect(200);
      expect(registrations.body).toHaveLength(1);
      expect(registrations.body[0].suggestedMeetFee).toBe(100);
      expect(registrations.body[0].suggestedPracticeFee).toBeGreaterThan(0);
      expect(registrations.body[0].suggestedPracticeFee).toBeLessThanOrEqual(
        1600,
      );

      const enrollments = await request(app.getHttpServer())
        .get(`/invoices/un-invoiced-enrollments?guardianId=${guardianId}`)
        .expect(200);
      expect(enrollments.body.data).toHaveLength(0);
    });

    it("rejects installments that do not add up to the total", async () => {
      await request(app.getHttpServer())
        .post("/invoices")
        .send(
          invoiceBody([
            { dueDate: "2099-01-01", amount: 100 },
            { dueDate: "2099-02-01", amount: 100 },
            { dueDate: "2099-03-01", amount: 100 },
            { dueDate: "2099-04-01", amount: 100 },
          ]),
        )
        .expect(400);
    });

    it("only allows pay in full or exactly four installments", async () => {
      await request(app.getHttpServer())
        .post("/invoices")
        .send(
          invoiceBody([
            { dueDate: "2099-01-01", amount: 850 },
            { dueDate: "2099-02-01", amount: 850 },
          ]),
        )
        .expect(400);
    });

    it("will not invoice the same season fee twice", async () => {
      await request(app.getHttpServer())
        .post("/invoices")
        .send(invoiceBody())
        .expect(201);
      await request(app.getHttpServer())
        .post("/invoices")
        .send(invoiceBody())
        .expect(400);

      const uninvoiced = await request(app.getHttpServer())
        .get(`/swim-team/registrations/uninvoiced?guardianId=${guardianId}`)
        .expect(200);
      expect(uninvoiced.body).toHaveLength(0);
    });

    it("lets an uninvoiced swimmer check in", async () => {
      await checkIn().expect(200);
    });

    it("asks for confirmation when a due installment is unpaid", async () => {
      const yesterday = ymd(new Date(Date.now() - DAY));
      const invoice = await request(app.getHttpServer())
        .post("/invoices")
        .send(
          invoiceBody([
            { dueDate: yesterday, amount: 700 },
            { dueDate: "2099-01-01", amount: 400 },
            { dueDate: "2099-02-01", amount: 300 },
            { dueDate: "2099-03-01", amount: 300 },
          ]),
        )
        .expect(201);
      expect(invoice.body.standing).toMatchObject({
        behindAmount: 700,
        isBehind: true,
      });

      const refused = await checkIn().expect(409);
      expect(refused.body).toMatchObject({
        code: "SWIM_TEAM_PAYMENT_BEHIND",
        behindAmount: 700,
      });
      expect(
        await prisma.attendance.count({ where: { enrollmentId } }),
      ).toBe(0);

      await checkIn({ acknowledgedOverdue: true }).expect(200);
      const attendance = await prisma.attendance.findFirstOrThrow({
        where: { enrollmentId },
      });
      expect(attendance.acknowledgedOverdue).toBe(true);
    });

    it("checks in without confirmation once the due installment is paid", async () => {
      const yesterday = ymd(new Date(Date.now() - DAY));
      const invoice = await request(app.getHttpServer())
        .post("/invoices")
        .send(
          invoiceBody([
            { dueDate: yesterday, amount: 700 },
            { dueDate: "2099-01-01", amount: 400 },
            { dueDate: "2099-02-01", amount: 300 },
            { dueDate: "2099-03-01", amount: 300 },
          ]),
        )
        .expect(201);

      await prisma.payment.create({
        data: {
          invoiceId: invoice.body.id,
          amount: 700,
          paymentDate: new Date(),
          paymentMethod: "cash",
        },
      });

      await checkIn().expect(200);
      const registrations = await request(app.getHttpServer())
        .get(`/swim-team/registrations?studentId=${studentId}`)
        .expect(200);
      expect(registrations.body[0].standing).toMatchObject({
        state: "on_track",
        nextDueDate: "2099-01-01",
      });
    });

    it("replaces the installment plan on an existing invoice", async () => {
      const invoice = await request(app.getHttpServer())
        .post("/invoices")
        .send(invoiceBody())
        .expect(201);

      const res = await request(app.getHttpServer())
        .put(`/invoices/${invoice.body.id}/installments`)
        .send({
          installments: [
            { dueDate: "2099-01-01", amount: 425 },
            { dueDate: "2099-02-01", amount: 425 },
            { dueDate: "2099-03-01", amount: 425 },
            { dueDate: "2099-04-01", amount: 425 },
          ],
        })
        .expect(200);
      expect(res.body.installments).toHaveLength(4);
      expect(res.body.standing.isBehind).toBe(false);

      await request(app.getHttpServer())
        .put(`/invoices/${invoice.body.id}/installments`)
        .send({ installments: [{ dueDate: "2099-01-01", amount: 1700 }] })
        .expect(400);

      // Clearing the plan makes the invoice due in full
      const cleared = await request(app.getHttpServer())
        .put(`/invoices/${invoice.body.id}/installments`)
        .send({ installments: [] })
        .expect(200);
      expect(cleared.body.installments).toHaveLength(0);
    });
  });

  describe("schedule views", () => {
    it("shows tier, meet status and standing on the daily and slot views", async () => {
      const created = await register({
        studentId,
        termId: seasonId,
        frequency: 2,
        competing: true,
        offeringIds: [offeringIds[0], offeringIds[1]],
      }).expect(201);

      const session = await prisma.classSession.findFirstOrThrow({
        where: { offeringId: offeringIds[0], date: { gte: new Date() } },
        orderBy: { date: "asc" },
      });
      const date = ymd(session.date);

      const daily = await request(app.getHttpServer())
        .get(`/terms/schedule/date/${date}`)
        .expect(200);
      const practice = daily.body.classes.find(
        (c: { offeringId: string }) => c.offeringId === offeringIds[0],
      );
      expect(practice.type).toBe("swim_team");
      expect(practice.roster[0].swimTeam).toMatchObject({
        registrationId: created.body.id,
        frequency: 2,
        competing: true,
        standing: { state: "not_invoiced" },
      });
      expect(practice.roster[0].swimTeam.slots).toHaveLength(2);

      const month = date.slice(0, 7);
      const slot = await request(app.getHttpServer())
        .get(
          `/terms/${seasonId}/schedule/weekday/1/slot/17:00/18:00?month=${month}`,
        )
        .expect(200);
      expect(slot.body.meta).toMatchObject({
        offeringType: "swim_team",
        month,
      });
      expect(slot.body.meta.months.length).toBeGreaterThan(8);
      // One month of weekly practices, not the whole season
      expect(slot.body.days.length).toBeLessThanOrEqual(5);
      expect(slot.body.days[0].rosters[0].roster[0].swimTeam.frequency).toBe(2);
    });
  });
});
