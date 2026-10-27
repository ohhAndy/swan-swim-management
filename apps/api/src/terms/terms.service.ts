import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { Term } from "@school/shared-types";
import { CreateTermInput } from "./dto/create-term.dto";
import { RequestStaffUser } from "../auth/auth.types";
import { computeEnd, weeklyDates } from "./terms.helpers";

@Injectable()
export class TermsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private async isUniqueSlug(base: string) {
    let candidate = base || "term";
    let n = 1;
    while (await this.prisma.term.findUnique({ where: { slug: candidate } })) {
      n++;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }

  async createTermWithSchedule(
    input: CreateTermInput,
    staffUser: RequestStaffUser,
    locationId?: string,
  ) {
    const { name, slug, startDate, endDate, weeks = 8, templates } = input;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate Location Access
    let assignedLocationId: string | null = null;

    if (staffUser.role === "admin") {
      assignedLocationId = locationId ?? null;
    } else {
      if (!locationId) {
        if (staffUser.accessibleLocations.length === 1) {
          assignedLocationId = staffUser.accessibleLocations[0].id;
        } else {
          throw new BadRequestException(
            "Location selection is required for managers creating terms.",
          );
        }
      } else {
        const hasAccess = staffUser.accessibleLocations.some(
          (loc) => loc.id === locationId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            "You do not have access to create terms for this location.",
          );
        }
        assignedLocationId = locationId;
      }
    }

    if (start >= end) {
      throw new BadRequestException("Start date must be before end date");
    }

    const base = slug && slug.length ? slug : this.slugify(name);
    const finalSlug = await this.isUniqueSlug(base);

    return await this.prisma.$transaction(
      async (tx) => {
        const newTerm = await tx.term.create({
          data: {
            name,
            slug: finalSlug,
            startDate: start,
            endDate: end,
            createdBy: staffUser?.id ?? null,
            locationId: assignedLocationId,
          },
        });

        await this.auditLogsService.create(
          {
            staffId: staffUser.id,
            action: "Create Term",
            entityType: "Term",
            entityId: newTerm.id,
            metadata: {
              title: newTerm.name,
            },
          },
          tx,
        );

        // Create Offerings (Day and Time Slot)
        const offerings = await Promise.all(
          templates.map((tpl) => {
            const computedEndTime = computeEnd(tpl.startTime, tpl.duration);
            return tx.classOffering.create({
              data: {
                termId: newTerm.id,
                weekday: tpl.weekday,
                startTime: tpl.startTime,
                endTime: computedEndTime,
                capacity: tpl.capacity ?? 4,
                title: tpl.title ?? "",
                type: "regular",
              },
            });
          }),
        );

        // Generate class sessions
        for (const off of offerings) {
          const dates = Array.from(weeklyDates(start, end, off.weekday));
          const sessionDates = weeks ? dates.slice(0, weeks) : dates;

          if (sessionDates.length > 0) {
            await tx.classSession.createMany({
              data: sessionDates.map((d) => ({
                offeringId: off.id,
                date: d,
                status: "scheduled",
                notes: null,
              })),
            });
          }
        }

        return newTerm;
      },
      { timeout: 30000 },
    );
  }

  async getAllTerms(locationId?: string): Promise<Term[]> {
    const terms = await this.prisma.term.findMany({
      where: locationId
        ? {
            OR: [{ locationId }, { locationId: null }],
          }
        : undefined,
      orderBy: { startDate: "desc" },
    });

    return terms.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      locationId: t.locationId ? t.locationId.toString() : null,
    }));
  }

  async getTermTitle(termId: string): Promise<string | null> {
    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      select: { name: true },
    });

    if (!term) return null;

    return term.name;
  }

  async getDefaultSlots(termId: string): Promise<(string | null)[]> {
    const offerings = await this.prisma.classOffering.findMany({
      where: { termId, type: "regular" },
      select: { weekday: true, startTime: true, endTime: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    const defaults: (string | null)[] = Array(7).fill(null);

    for (const off of offerings) {
      if (defaults[off.weekday] === null) {
        defaults[off.weekday] = `${off.startTime}-${off.endTime}`;
      }
    }

    return defaults;
  }

  async getSlotsForWeekday(termId: string, weekday: number): Promise<string[]> {
    const offerings = await this.prisma.classOffering.findMany({
      where: { termId, weekday, type: "regular" },
      select: { startTime: true, endTime: true },
      distinct: ["startTime", "endTime"],
      orderBy: { startTime: "asc" },
    });

    return offerings.map((o) => `${o.startTime}-${o.endTime}`);
  }

  async getDetailedSlotsForWeekday(termId: string, weekday: number) {
    const offerings = await this.prisma.classOffering.findMany({
      where: { termId, weekday, type: "regular" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        capacity: true,
        instructors: {
          where: { removedAt: null },
          select: { id: true },
        },
        enrollments: {
          where: { status: "active" },
          select: { id: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const groups: Record<
      string,
      {
        time: string;
        offeringCount: number;
        realCapacity: number;
        filledSeats: number;
      }
    > = {};

    for (const off of offerings) {
      const time = `${off.startTime}-${off.endTime}`;
      if (!groups[time]) {
        groups[time] = {
          time,
          offeringCount: 0,
          realCapacity: 0,
          filledSeats: 0,
        };
      }

      let realCap: number;
      const count = off.instructors.length;
      if (count === 1) {
        realCap = Math.min(off.capacity, 4);
      } else if (count >= 2) {
        realCap = Math.max(off.capacity, 5);
      } else {
        realCap = off.capacity;
      }

      groups[time].offeringCount += 1;
      groups[time].realCapacity += realCap;
      groups[time].filledSeats += off.enrollments.length;
    }

    return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
  }
}
