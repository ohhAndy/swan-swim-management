import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { calculateClassUsage } from "../common/capacity.utils";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seatsForSlot(params: {
    termId: string;
    weekday: number;
    startTime: string;
    dateOnly: string;
  }) {
    const date = new Date(`${params.dateOnly}T00:00:00.000Z`);

    const offerings = await this.prisma.classOffering.findMany({
      where: {
        termId: params.termId,
        weekday: params.weekday,
        startTime: params.startTime,
      },
      select: {
        id: true,
        title: true,
        capacity: true,
        instructors: {
          where: { removedAt: null },
          select: { id: true },
        },
      },
    });
    if (offerings.length === 0) return [];

    const sessions = await this.prisma.classSession.findMany({
      where: { offeringId: { in: offerings.map((o) => o.id) }, date },
      select: { id: true, offeringId: true },
    });
    const sessionByOffering = new Map(sessions.map((s) => [s.offeringId, s]));
    const sessionIds = sessions.map((s) => s.id);

    const regulars = await this.prisma.enrollment.findMany({
      where: {
        offeringId: { in: offerings.map((o) => o.id) },
        status: "active",
        enrollDate: { lte: date },
      },
      select: {
        id: true,
        offeringId: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shortCode: true,
          },
        },
        classRatio: true,
      },
    });

    const makeups = await this.prisma.makeUpBooking.findMany({
      where: {
        classSessionId: { in: sessions.map((s) => s.id) },
        status: { in: ["scheduled", "attended"] as any },
      },
      select: {
        classSessionId: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            level: true,
            shortCode: true,
          },
        },
      },
    });

    const makeupsBySession = makeups.reduce<
      Record<string, { id: string; name: string; code: string | null }[]>
    >((acc, m) => {
      const k = m.classSessionId;
      const name = `${m.student.firstName} ${m.student.lastName}`;
      (acc[k] ??= []).push({
        id: m.student.id,
        name,
        code: m.student.shortCode ?? null,
      });
      return acc;
    }, {});

    const skipsBySession = new Map<string, Set<string>>();
    if (sessionIds.length) {
      const skips = await this.prisma.enrollmentSkip.findMany({
        where: { classSessionId: { in: sessionIds } },
        select: { classSessionId: true, enrollmentId: true },
      });
      for (const s of skips) {
        const set = skipsBySession.get(s.classSessionId) ?? new Set<string>();
        set.add(s.enrollmentId);
        skipsBySession.set(s.classSessionId, set);
      }
    }

    const excusedBySession = new Map<string, Set<string>>();
    if (sessionIds.length) {
      const excused = await this.prisma.attendance.findMany({
        where: { classSessionId: { in: sessionIds }, status: "excused" },
        select: { classSessionId: true, enrollmentId: true },
      });
      for (const e of excused) {
        const set = excusedBySession.get(e.classSessionId) ?? new Set<string>();
        set.add(e.enrollmentId);
        excusedBySession.set(e.classSessionId, set);
      }
    }

    return offerings.map((o) => {
      const ses = sessionByOffering.get(o.id);
      const skipSet = ses
        ? skipsBySession.get(ses.id) ?? new Set<string>()
        : new Set<string>();
      const excusedSet = ses
        ? excusedBySession.get(ses.id) ?? new Set<string>()
        : new Set<string>();

      const regs = regulars
        .filter((r) => r.offeringId === o.id)
        .filter((r) => (ses ? !skipSet.has(r.id) : true))
        .filter((r) => (ses ? !excusedSet.has(r.id) : true))
        .map((r) => ({
          type: "filled" as const,
          studentId: r.student.id,
          name: `${r.student.firstName} ${r.student.lastName}`,
          code: r.student.shortCode ?? null,
          ratio: r.classRatio, // Using ratio for weighting
        }));

      const mUps = ses?.id
        ? (makeupsBySession[ses.id] ?? []).map((s) => ({
            type: "filled" as const,
            studentId: s.id,
            name: s.name,
            code: s.code,
            makeup: true,
            ratio: "3:1", // Default makeup ratio
          }))
        : [];

      // Calculate Weighted Usage
      const { effectiveCapacity, openSeats } = calculateClassUsage(
        [
          ...regs.map((r) => ({ classRatio: r.ratio })),
          ...mUps.map((m) => ({ classRatio: m.ratio })),
        ],
        o.instructors.length,
        o.capacity
      );

      const filledItems = [...regs, ...mUps];

      return {
        offeringId: o.id,
        offeringTitle: o.title,
        capacity: effectiveCapacity,
        sessionId: ses?.id ?? null,
        date: params.dateOnly,
        seats: [
          ...filledItems,
          ...Array.from({ length: openSeats }).map(() => ({
            type: "empty" as const,
          })),
        ],
      };
    });
  }
}
