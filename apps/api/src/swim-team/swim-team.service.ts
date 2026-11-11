import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";
import { getTorontoDateString } from "../common/date.utils";
import {
  calculateSwimTeamFees,
  SWIM_TEAM_FREQUENCIES,
  DEFAULT_SWIM_TEAM_MEET_FEES,
  type SwimTeamFeeTier,
} from "@school/shared-types";
import {
  CreateRegistrationInput,
  RegistrationQuery,
  UninvoicedRegistrationQuery,
  UpdateRegistrationInput,
} from "./dto/swim-team.dto";
import { SwimTeamStandingService } from "./swim-team-standing.service";
import { SwimTeamFeeTierInput } from "../terms/dto/create-term.dto";

const registrationInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      shortCode: true,
      guardianId: true,
    },
  },
  term: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      locationId: true,
    },
  },
  enrollments: {
    where: { status: "active" },
    select: {
      id: true,
      offeringId: true,
      offering: {
        select: {
          id: true,
          title: true,
          weekday: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  },
} satisfies Prisma.SwimTeamRegistrationInclude;

type RegistrationWithRelations = Prisma.SwimTeamRegistrationGetPayload<{
  include: typeof registrationInclude;
}>;

const toDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);
const toYmd = (value: Date) => value.toISOString().slice(0, 10);

@Injectable()
export class SwimTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly standingService: SwimTeamStandingService,
  ) {}

  // ---------------------------------------------------------------------
  // Seasons & fee tiers
  // ---------------------------------------------------------------------

  private async getSeasonOrThrow(termId: string) {
    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        locationId: true,
      },
    });
    if (!term) throw new NotFoundException("Term not found");
    if (term.type !== "swim_team_season") {
      throw new BadRequestException("This term is not a swim team season");
    }
    return term;
  }

  private serializeTiers(
    tiers: { frequency: number; practiceFee: Prisma.Decimal; meetFee: Prisma.Decimal }[],
  ): SwimTeamFeeTier[] {
    const byFrequency = new Map(tiers.map((t) => [t.frequency, t]));
    return SWIM_TEAM_FREQUENCIES.map((frequency) => {
      const tier = byFrequency.get(frequency);
      return {
        frequency,
        practiceFee: tier ? Number(tier.practiceFee) : 0,
        meetFee: tier
          ? Number(tier.meetFee)
          : DEFAULT_SWIM_TEAM_MEET_FEES[frequency],
      };
    });
  }

  async getFeeTiers(termId: string): Promise<SwimTeamFeeTier[]> {
    await this.getSeasonOrThrow(termId);
    const tiers = await this.prisma.swimTeamFeeTier.findMany({
      where: { termId },
    });
    return this.serializeTiers(tiers);
  }

  async updateFeeTiers(
    termId: string,
    tiers: SwimTeamFeeTierInput[],
    staffUser: RequestStaffUser,
  ): Promise<SwimTeamFeeTier[]> {
    await this.getSeasonOrThrow(termId);

    if (new Set(tiers.map((t) => t.frequency)).size !== tiers.length) {
      throw new BadRequestException("Each frequency can only appear once");
    }

    const before = await this.getFeeTiers(termId);

    await this.prisma.$transaction(async (tx) => {
      for (const tier of tiers) {
        await tx.swimTeamFeeTier.upsert({
          where: {
            termId_frequency: { termId, frequency: tier.frequency },
          },
          update: { practiceFee: tier.practiceFee, meetFee: tier.meetFee },
          create: {
            termId,
            frequency: tier.frequency,
            practiceFee: tier.practiceFee,
            meetFee: tier.meetFee,
          },
        });
      }

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Update Swim Team Fees",
          entityType: "Term",
          entityId: termId,
          changes: { from: before, to: tiers } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );
    });

    return this.getFeeTiers(termId);
  }

  /** Seasons with their tiers and practice slots, for the registration form */
  async getSeasons(locationId?: string | null) {
    const terms = await this.prisma.term.findMany({
      where: {
        type: "swim_team_season",
        ...(locationId
          ? { OR: [{ locationId }, { locationId: null }] }
          : {}),
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        locationId: true,
        swimTeamFeeTiers: true,
        offerings: {
          where: { type: "swim_team" },
          orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
          select: {
            id: true,
            title: true,
            weekday: true,
            startTime: true,
            endTime: true,
            capacity: true,
            _count: { select: { enrollments: { where: { status: "active" } } } },
          },
        },
      },
    });

    return terms.map((term) => ({
      id: term.id,
      name: term.name,
      startDate: toYmd(term.startDate),
      endDate: toYmd(term.endDate),
      locationId: term.locationId,
      tiers: this.serializeTiers(term.swimTeamFeeTiers),
      slots: term.offerings.map((o) => ({
        offeringId: o.id,
        title: o.title,
        weekday: o.weekday,
        startTime: o.startTime,
        endTime: o.endTime,
        capacity: o.capacity,
        filled: o._count.enrollments,
      })),
    }));
  }

  // ---------------------------------------------------------------------
  // Registrations
  // ---------------------------------------------------------------------

  private async serialize(registrations: RegistrationWithRelations[]) {
    const standings = await this.standingService.getStandings(
      registrations.map((r) => r.id),
    );

    return registrations.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      studentCode: r.student.shortCode,
      guardianId: r.student.guardianId,
      termId: r.termId,
      termName: r.term.name,
      seasonStart: toYmd(r.term.startDate),
      seasonEnd: toYmd(r.term.endDate),
      frequency: r.frequency,
      competing: r.competing,
      status: r.status,
      startDate: toYmd(r.startDate),
      endDate: r.endDate ? toYmd(r.endDate) : null,
      notes: r.notes,
      slots: r.enrollments
        .map((e) => ({
          enrollmentId: e.id,
          offeringId: e.offeringId,
          title: e.offering.title,
          weekday: e.offering.weekday,
          startTime: e.offering.startTime,
          endTime: e.offering.endTime,
        }))
        .sort(
          (a, b) =>
            (a.weekday ?? 0) - (b.weekday ?? 0) ||
            (a.startTime ?? "").localeCompare(b.startTime ?? ""),
        ),
      standing: standings.get(r.id) ?? {
        state: "not_invoiced" as const,
        behindAmount: 0,
        nextDueDate: null,
        invoiceIds: [],
      },
    }));
  }

  /**
   * Checks the picked slots belong to the season and have room. Enrollments
   * the swimmer already holds in a slot do not count against capacity.
   */
  private async validateSlots(
    tx: Prisma.TransactionClient,
    termId: string,
    offeringIds: string[],
    studentId: string,
  ) {
    const offerings = await tx.classOffering.findMany({
      where: { id: { in: offeringIds } },
      select: {
        id: true,
        termId: true,
        type: true,
        title: true,
        capacity: true,
        enrollments: {
          where: { status: "active" },
          select: { studentId: true },
        },
      },
    });

    if (offerings.length !== offeringIds.length) {
      throw new NotFoundException("One or more practice slots were not found");
    }

    for (const offering of offerings) {
      if (offering.termId !== termId || offering.type !== "swim_team") {
        throw new BadRequestException(
          `"${offering.title}" is not a practice in this swim team season`,
        );
      }
      const others = offering.enrollments.filter(
        (e) => e.studentId !== studentId,
      ).length;
      if (others >= offering.capacity) {
        throw new BadRequestException(`"${offering.title}" is full`);
      }
    }
  }

  /** Makes the swimmer's active slot enrollments match `offeringIds` */
  private async syncSlots(
    tx: Prisma.TransactionClient,
    registration: { id: string; studentId: string },
    offeringIds: string[],
    staffUser: RequestStaffUser,
    today: string,
  ) {
    const existing = await tx.enrollment.findMany({
      where: {
        studentId: registration.studentId,
        OR: [
          { swimTeamRegistrationId: registration.id },
          { offeringId: { in: offeringIds } },
        ],
      },
      select: {
        id: true,
        offeringId: true,
        status: true,
        _count: { select: { attendance: true } },
      },
    });

    const wanted = new Set(offeringIds);
    const byOffering = new Map(existing.map((e) => [e.offeringId, e]));

    for (const enrollment of existing) {
      if (wanted.has(enrollment.offeringId)) continue;
      if (enrollment._count.attendance === 0) {
        // Never attended this slot: no history worth keeping
        await tx.enrollment.delete({ where: { id: enrollment.id } });
      } else if (enrollment.status === "active") {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "inactive", endDate: toDateOnly(today) },
        });
      }
    }

    for (const offeringId of offeringIds) {
      const current = byOffering.get(offeringId);
      if (current) {
        await tx.enrollment.update({
          where: { id: current.id },
          data: {
            status: "active",
            endDate: null,
            swimTeamRegistrationId: registration.id,
          },
        });
      } else {
        await tx.enrollment.create({
          data: {
            studentId: registration.studentId,
            offeringId,
            status: "active",
            enrollDate: new Date(),
            createdBy: staffUser.id,
            swimTeamRegistrationId: registration.id,
          },
        });
      }
    }
  }

  async createRegistration(
    input: CreateRegistrationInput,
    staffUser: RequestStaffUser,
  ) {
    const term = await this.getSeasonOrThrow(input.termId);

    const student = await this.prisma.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException("Student not found");

    const existing = await this.prisma.swimTeamRegistration.findUnique({
      where: {
        studentId_termId: { studentId: input.studentId, termId: input.termId },
      },
    });
    if (existing && existing.status === "active") {
      throw new BadRequestException(
        "This swimmer is already registered for this season",
      );
    }

    const today = getTorontoDateString();
    const seasonStart = toYmd(term.startDate);
    const seasonEnd = toYmd(term.endDate);
    const requestedStart = input.startDate ?? today;
    if (requestedStart > seasonEnd) {
      throw new BadRequestException("Start date is after the season ends");
    }
    const startDate = requestedStart < seasonStart ? seasonStart : requestedStart;

    const registrationId = await this.prisma.$transaction(async (tx) => {
      await this.validateSlots(tx, term.id, input.offeringIds, student.id);

      const data = {
        frequency: input.frequency,
        competing: input.competing,
        status: "active" as const,
        startDate: toDateOnly(startDate),
        endDate: null,
        notes: input.notes ?? null,
      };

      // A withdrawn swimmer coming back reuses their registration row
      const registration = existing
        ? await tx.swimTeamRegistration.update({
            where: { id: existing.id },
            data,
          })
        : await tx.swimTeamRegistration.create({
            data: {
              ...data,
              studentId: student.id,
              termId: term.id,
              createdBy: staffUser.id,
            },
          });

      await this.syncSlots(tx, registration, input.offeringIds, staffUser, today);

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Register Swim Team",
          entityType: "SwimTeamRegistration",
          entityId: registration.id,
          metadata: {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            termId: term.id,
            frequency: input.frequency,
            competing: input.competing,
            offeringIds: input.offeringIds,
          },
        },
        tx,
      );

      return registration.id;
    });

    return this.findOne(registrationId);
  }

  async findOne(id: string) {
    const registration = await this.prisma.swimTeamRegistration.findUnique({
      where: { id },
      include: registrationInclude,
    });
    if (!registration) throw new NotFoundException("Registration not found");
    const [serialized] = await this.serialize([registration]);
    return serialized;
  }

  async findAll(query: RegistrationQuery) {
    if (!query.studentId && !query.termId) {
      throw new BadRequestException("Provide a studentId or a termId");
    }
    const registrations = await this.prisma.swimTeamRegistration.findMany({
      where: {
        ...(query.studentId ? { studentId: query.studentId } : {}),
        ...(query.termId ? { termId: query.termId } : {}),
      },
      include: registrationInclude,
      orderBy: { createdAt: "desc" },
    });
    return this.serialize(registrations);
  }

  /**
   * Changes tier, slots or competing status. Returns the registration along
   * with a suggested season fee so staff can adjust the existing invoice.
   */
  async updateRegistration(
    id: string,
    input: UpdateRegistrationInput,
    staffUser: RequestStaffUser,
  ) {
    const registration = await this.prisma.swimTeamRegistration.findUnique({
      where: { id },
      include: {
        term: { select: { id: true, startDate: true, endDate: true } },
        enrollments: {
          where: { status: "active" },
          select: { offeringId: true },
        },
      },
    });
    if (!registration) throw new NotFoundException("Registration not found");
    if (registration.status !== "active") {
      throw new BadRequestException("This registration is no longer active");
    }

    const frequency = input.frequency ?? registration.frequency;
    const competing = input.competing ?? registration.competing;
    const currentOfferingIds = registration.enrollments.map((e) => e.offeringId);
    const offeringIds = input.offeringIds ?? currentOfferingIds;

    if (offeringIds.length !== frequency) {
      throw new BadRequestException(
        `A ${frequency}x per week swimmer needs exactly ${frequency} practice slot${frequency === 1 ? "" : "s"}`,
      );
    }

    const today = getTorontoDateString();

    await this.prisma.$transaction(async (tx) => {
      if (input.offeringIds) {
        await this.validateSlots(
          tx,
          registration.termId,
          offeringIds,
          registration.studentId,
        );
        await this.syncSlots(tx, registration, offeringIds, staffUser, today);
      }

      await tx.swimTeamRegistration.update({
        where: { id },
        data: {
          frequency,
          competing,
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Update Swim Team Registration",
          entityType: "SwimTeamRegistration",
          entityId: id,
          changes: {
            frequency: { from: registration.frequency, to: frequency },
            competing: { from: registration.competing, to: competing },
            offeringIds: { from: currentOfferingIds, to: offeringIds },
          },
        },
        tx,
      );
    });

    const feeSuggestion = await this.suggestFeesAfterChange(
      {
        id,
        termId: registration.termId,
        startDate: toYmd(registration.startDate),
        seasonStart: toYmd(registration.term.startDate),
        seasonEnd: toYmd(registration.term.endDate),
      },
      registration.frequency,
      frequency,
      competing,
      today,
    );

    return { registration: await this.findOne(id), feeSuggestion };
  }

  /**
   * Season fee after a mid-season change: months already swum are charged at
   * the old tier, the months remaining (including this one) at the new tier.
   */
  private async suggestFeesAfterChange(
    registration: {
      id: string;
      termId: string;
      startDate: string;
      seasonStart: string;
      seasonEnd: string;
    },
    oldFrequency: number,
    newFrequency: number,
    competing: boolean,
    today: string,
  ) {
    const tiers = await this.getFeeTiers(registration.termId);
    const tierFor = (frequency: number) =>
      tiers.find((t) => t.frequency === frequency) ?? {
        frequency,
        practiceFee: 0,
        meetFee: 0,
      };
    const { seasonStart, seasonEnd, startDate } = registration;
    const changeDate = today < startDate ? startDate : today;

    const oldFromStart = calculateSwimTeamFees(
      tierFor(oldFrequency),
      false,
      seasonStart,
      seasonEnd,
      startDate,
    ).practiceFee;
    const oldFromChange = calculateSwimTeamFees(
      tierFor(oldFrequency),
      false,
      seasonStart,
      seasonEnd,
      changeDate,
    ).practiceFee;
    const next = calculateSwimTeamFees(
      tierFor(newFrequency),
      competing,
      seasonStart,
      seasonEnd,
      changeDate,
    );

    const practiceFee =
      Math.round((oldFromStart - oldFromChange + next.practiceFee) * 100) / 100;

    const lines = await this.prisma.invoiceLineItem.findMany({
      where: {
        swimTeamRegistrationId: registration.id,
        invoice: { status: { not: "void" } },
      },
      select: { invoiceId: true, feeType: true, amount: true },
    });
    const sum = (type: string) =>
      lines
        .filter((l) => l.feeType === type)
        .reduce((total, l) => total + Number(l.amount), 0);

    return {
      practiceFee,
      meetFee: next.meetFee,
      invoicedPracticeFee: sum("swim_team_practice"),
      invoicedMeetFee: sum("swim_team_meet"),
      invoiceIds: [...new Set(lines.map((l) => l.invoiceId))],
    };
  }

  async withdraw(id: string, staffUser: RequestStaffUser) {
    const registration = await this.prisma.swimTeamRegistration.findUnique({
      where: { id },
      select: { id: true, status: true, studentId: true },
    });
    if (!registration) throw new NotFoundException("Registration not found");
    if (registration.status !== "active") {
      throw new BadRequestException("This registration is already withdrawn");
    }

    const today = toDateOnly(getTorontoDateString());

    await this.prisma.$transaction(async (tx) => {
      await tx.swimTeamRegistration.update({
        where: { id },
        data: { status: "inactive", endDate: today },
      });
      await tx.enrollment.updateMany({
        where: { swimTeamRegistrationId: id, status: "active" },
        data: { status: "inactive", endDate: today },
      });
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Withdraw Swim Team",
          entityType: "SwimTeamRegistration",
          entityId: id,
          changes: { status: { from: "active", to: "inactive" } },
          metadata: { studentId: registration.studentId },
        },
        tx,
      );
    });

    return this.findOne(id);
  }

  /** Registrations with no season invoice yet, with suggested fee lines */
  async findUninvoiced(query: UninvoicedRegistrationQuery) {
    const registrations = await this.prisma.swimTeamRegistration.findMany({
      where: {
        status: "active",
        lineItems: { none: { invoice: { status: { not: "void" } } } },
        ...(query.guardianId
          ? { student: { guardianId: query.guardianId } }
          : {}),
      },
      include: registrationInclude,
      orderBy: { createdAt: "desc" },
    });
    if (registrations.length === 0) return [];

    const tiers = await this.prisma.swimTeamFeeTier.findMany({
      where: { termId: { in: [...new Set(registrations.map((r) => r.termId))] } },
    });
    const serialized = await this.serialize(registrations);

    return serialized.map((r) => {
      const tier = tiers.find(
        (t) => t.termId === r.termId && t.frequency === r.frequency,
      );
      const fees = calculateSwimTeamFees(
        {
          practiceFee: tier ? Number(tier.practiceFee) : 0,
          meetFee: tier ? Number(tier.meetFee) : 0,
        },
        r.competing,
        r.seasonStart,
        r.seasonEnd,
        r.startDate,
      );
      return {
        ...r,
        suggestedPracticeFee: fees.practiceFee,
        suggestedMeetFee: fees.meetFee,
        monthsRemaining: fees.monthsRemaining,
        seasonMonths: fees.seasonMonths,
      };
    });
  }
}
