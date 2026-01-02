import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  MakeupLite,
  RosterResponse,
  SlotPage,
  Term,
  TrialLite,
} from "@school/shared-types";
import { CreateTermInput } from "./dto/create-term.dto";
import { SessionStatus, Prisma } from "@prisma/client";

// Use UTC for date matching to ensure consistency
function getUTCDayKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function* weeklyDates(start: Date, end: Date, weekday: number) {
  const cur = new Date(start);
  // Set to noon UTC to avoid timezone shifts (e.g. 00:00 UTC -> 19:00 EST prev day)
  cur.setUTCHours(12, 0, 0, 0);

  // Advance to first matching weekday (UTC)
  while (cur.getUTCDay() !== weekday) {
    cur.setDate(cur.getDate() + 1);
  }

  const endKey = getUTCDayKey(end);
  while (true) {
    const curKey = getUTCDayKey(cur);
    if (curKey > endKey) break;

    yield new Date(cur); // Returns a new Date object with same time

    cur.setDate(cur.getDate() + 7);
  }
}

function computeEnd(start: string, duration: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + duration;
  const hh = Math.floor((total % (24 * 60)) / 60.0);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

@Injectable()
export class TermsService {
  //Create a prismaservice to use
  constructor(private prisma: PrismaService) {}

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

  async createTermWithSchedule(input: CreateTermInput, user: any) {
    const { name, slug, startDate, endDate, weeks = 8, templates } = input;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const term = await this.prisma.$transaction(
      async (tx) => {
        const finalSlug = slug ?? (await this.isUniqueSlug(this.slugify(name)));

        //Create term
        const newTerm = await tx.term.create({
          data: {
            name,
            slug: finalSlug,
            startDate: start,
            endDate: end,
            createdBy: staffUser?.id ?? null,
          },
        });

        const audit = await tx.auditLog.create({
          data: {
            staffId: staffUser.id,
            action: "Create Term",
            entityType: "Term",
            entityId: newTerm.id,
            metadata: {
              title: newTerm.name,
            },
          },
        });

        //Create Offerings (Day and Time Slot)
        const offerings = await Promise.all(
          templates.map((t) =>
            tx.classOffering.create({
              data: {
                termId: newTerm.id,
                title: t.title,
                weekday: t.weekday,
                startTime: t.startTime,
                endTime: computeEnd(t.startTime, t.duration),
                duration: t.duration,
                capacity: t.capacity,
                notes: t.notes ?? null,
              },
            })
          )
        );

        //Create ClassSessions (Individual DATES of the classes)
        const allSessions: Prisma.ClassSessionCreateManyInput[] = [];

        offerings.forEach((offering, i) => {
          const template = templates[i];
          const dates = weeklyDates(startDate, endDate, template.weekday);

          let count = 0;
          for (const d of dates) {
            allSessions.push({
              offeringId: offering.id,
              date: d,
              status: SessionStatus.scheduled,
              notes: null,
            });
            if (++count >= weeks) break;
          }
        });

        await tx.classSession.createMany({
          data: allSessions,
        });

        return newTerm;
      },
      { maxWait: 10000, timeout: 20000 }
    );

    return term.id;
  }

  async getAllTerms(): Promise<Term[]> {
    const terms = await this.prisma.term.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });
    return terms;
  }

  async getTermTitle(termId: string): Promise<string | null> {
    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      select: { name: true },
    });

    return term?.name ?? null;
  }

  async getDefaultSlots(termId: string): Promise<(string | null)[]> {
    // run 7 findFirst queries in parallel (Sun..Sat)
    const queries = Array.from({ length: 7 }, (_, i) =>
      this.prisma.classOffering.findFirst({
        where: { termId, weekday: i },
        orderBy: [{ startTime: "asc" }],
        select: { startTime: true, endTime: true },
      })
    );
    const results = await Promise.all(queries);
    const result = results.map((first) =>
      first ? `${first.startTime}-${first.endTime}` : null
    );
    return result;
  }

  async getSlotsForWeekday(termId: string, weekday: number): Promise<string[]> {
    const sessions = await this.prisma.classOffering.findMany({
      where: { termId, weekday },
      select: { startTime: true, endTime: true },
      distinct: ["startTime", "endTime"],
      orderBy: [{ startTime: "asc" }],
    });

    return sessions.map((s) => `${s.startTime}-${s.endTime}`);
  }

  async slotByWeekdayAndTime(
    weekday: number,
    termId: string,
    startTime: string,
    endTime: string
  ): Promise<SlotPage> {
    console.time(`[Schedule] Total Query Time`);

    if (weekday < 0 || weekday > 6) {
      throw new BadRequestException("Not a real weekday");
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new BadRequestException("Time is not HH:MM");
    }

    // Step 1: Get term and offerings in parallel
    console.time("[Schedule] 1. Get Term + Offerings");
    const [term, offerings] = await Promise.all([
      this.prisma.term.findUnique({
        where: { id: termId },
        select: { id: true, name: true },
      }),
      this.prisma.classOffering.findMany({
        where: { weekday, startTime, endTime, termId },
        select: {
          id: true,
          capacity: true,
          title: true,
        },
      }),
    ]);
    console.timeEnd("[Schedule] 1. Get Term + Offerings");

    if (!term) {
      throw new NotFoundException("Term Does Not Exist");
    }

    const termMeta: Term = {
      id: term.id.toString(),
      name: term.name,
    };

    if (offerings.length === 0) {
      console.timeEnd(`[Schedule] Total Query Time`);
      return {
        meta: { weekday, startTime, endTime, term: termMeta },
        days: [],
      };
    }

    const offeringIds = offerings.map((o) => o.id);
    const capacityMap = new Map(offerings.map((o) => [o.id, o.capacity]));

    // Step 2: Get sessions
    console.time("[Schedule] 2. Get Sessions");
    const sessions = await this.prisma.classSession.findMany({
      where: { offeringId: { in: offeringIds } },
      select: {
        id: true,
        date: true,
        offeringId: true,
        status: true,
        offering: {
          select: {
            title: true,
            notes: true,
            instructors: {
              where: { removedAt: null },
              select: {
                id: true,
                staffUserId: true,
                staffUser: {
                  select: {
                    fullName: true,
                  },
                },
              },
              orderBy: { assignedAt: "asc" },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });
    console.timeEnd("[Schedule] 2. Get Sessions");

    if (sessions.length === 0) {
      console.timeEnd(`[Schedule] Total Query Time`);
      return {
        meta: { weekday, startTime, endTime, term: termMeta },
        days: [],
      };
    }

    const sessionIds = sessions.map((s) => s.id);

    // Build session maps
    const sessionsByDate = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const date = s.date.toISOString().slice(0, 10);
      const arr = sessionsByDate.get(date) ?? [];
      arr.push(s);
      sessionsByDate.set(date, arr);
    }

    // Step 3: Get enrollments first to get enrollment IDs
    console.time("[Schedule] 3. Get Enrollments");
    const enrollments = await this.prisma.enrollment.findMany({
      where: { offeringId: { in: offeringIds }, status: "active" },
      select: {
        id: true,
        offeringId: true,
        studentId: true,
        notes: true,
        classRatio: true,
        invoiceLineItem: {
          select: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                totalAmount: true,
                payments: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shortCode: true,
            level: true,
            birthdate: true,
          },
        },
      },
    });
    console.timeEnd("[Schedule] 3. Get Enrollments");

    const enrollmentsByOffering = new Map<string, typeof enrollments>();
    for (const e of enrollments) {
      const arr = enrollmentsByOffering.get(e.offeringId) ?? [];
      arr.push(e);
      enrollmentsByOffering.set(e.offeringId, arr);
    }

    const enrollmentIds = enrollments.map((e) => e.id);

    // Step 4: Fetch all remaining data IN PARALLEL
    console.time(
      "[Schedule] 4. Parallel Fetch (Attendance/Skips/Makeups/Counts)"
    );
    const [
      attendanceRecords,
      skipRecords,
      makeUpBookings,
      trialBookings,
      skipCounts,
      excusedCounts,
      makeupCounts,
      trialCounts,
    ] = await Promise.all([
      // Query: Get attendance records
      this.prisma.attendance.findMany({
        where: {
          enrollmentId: { in: enrollmentIds },
          classSessionId: { in: sessionIds },
        },
        select: {
          id: true,
          enrollmentId: true,
          classSessionId: true,
          status: true,
        },
      }),

      // Query: Get enrollment skips
      this.prisma.enrollmentSkip.findMany({
        where: {
          enrollmentId: { in: enrollmentIds },
          classSessionId: { in: sessionIds },
        },
        select: {
          enrollmentId: true,
          classSessionId: true,
        },
      }),

      // Query: Get make-up bookings
      this.prisma.makeUpBooking.findMany({
        where: { classSessionId: { in: sessionIds } },
        select: {
          id: true,
          classSessionId: true,
          studentId: true,
          status: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              level: true,
              shortCode: true,
            },
          },
        },
      }),

      // Query: Get trial bookings
      this.prisma.trialBooking.findMany({
        where: { classSessionId: { in: sessionIds } },
        select: {
          id: true,
          classSessionId: true,
          childName: true,
          childAge: true,
          parentPhone: true,
          status: true,
          notes: true,
        },
      }),

      // Query: Get skip counts per session
      this.prisma.enrollmentSkip.groupBy({
        by: ["classSessionId"],
        where: { classSessionId: { in: sessionIds } },
        _count: { _all: true },
      }),

      // Query: Get excused counts per session
      this.prisma.attendance.groupBy({
        by: ["classSessionId"],
        where: { classSessionId: { in: sessionIds }, status: "excused" },
        _count: { _all: true },
      }),

      // Query: Get makeup counts per session
      this.prisma.makeUpBooking.groupBy({
        by: ["classSessionId"],
        where: { classSessionId: { in: sessionIds } },
        _count: { _all: true },
      }),

      // Query: Get trial counts per session (for capacity)
      this.prisma.trialBooking.groupBy({
        by: ["classSessionId"],
        where: {
          classSessionId: { in: sessionIds },
          status: { in: ["scheduled", "attended"] },
        },
        _count: { _all: true },
      }),
    ]);
    console.timeEnd(
      "[Schedule] 4. Parallel Fetch (Attendance/Skips/Makeups/Counts)"
    );

    // Build maps
    console.time("[Schedule] 5. Build Maps + Response");
    // Build attendance map
    const attendanceMap = new Map<
      string,
      Map<string, (typeof attendanceRecords)[0]>
    >();
    for (const a of attendanceRecords) {
      if (!attendanceMap.has(a.enrollmentId)) {
        attendanceMap.set(a.enrollmentId, new Map());
      }
      attendanceMap.get(a.enrollmentId)!.set(a.classSessionId, a);
    }

    // Build skip map
    const skipMap = new Map<string, Set<string>>();
    for (const skip of skipRecords) {
      if (!skipMap.has(skip.enrollmentId)) {
        skipMap.set(skip.enrollmentId, new Set());
      }
      skipMap.get(skip.enrollmentId)!.add(skip.classSessionId);
    }

    // Build makeup map
    const makeUpsBySession = new Map<string, typeof makeUpBookings>();
    for (const m of makeUpBookings) {
      const arr = makeUpsBySession.get(m.classSessionId) ?? [];
      arr.push(m);
      makeUpsBySession.set(m.classSessionId, arr);
    }

    // Build trial map
    const trialsBySession = new Map<string, typeof trialBookings>();
    for (const t of trialBookings) {
      const arr = trialsBySession.get(t.classSessionId) ?? [];
      arr.push(t);
      trialsBySession.set(t.classSessionId, arr);
    }

    // Build count maps
    const skipCountMap = new Map(
      skipCounts.map((x) => [x.classSessionId, x._count._all])
    );
    const excusedMap = new Map(
      excusedCounts.map((x) => [x.classSessionId, x._count._all])
    );
    const makeupCountMap = new Map(
      makeupCounts.map((x) => [x.classSessionId, x._count._all])
    );
    const trialCountMap = new Map(
      trialCounts.map((x) => [x.classSessionId, x._count._all])
    );

    // Build response
    const days = Array.from(sessionsByDate.entries())
      .sort()
      .map(([date, sessionList]) => {
        const rosters: RosterResponse[] = sessionList.map((s) => {
          const offeringEnrollments =
            enrollmentsByOffering.get(s.offeringId) ?? [];
          // OLD Count Logic (replaced by capacity.utils)
          // const regulars = offeringEnrollments.length;
          // const skips = skipCountMap.get(s.id) ?? 0;
          // const makeups = makeupCountMap.get(s.id) ?? 0;
          // const trials = trialCountMap.get(s.id) ?? 0;
          // const excused = excusedMap.get(s.id) ?? 0;
          // const capacity = capacityMap.get(s.offeringId) ?? 0;
          // const filled = Math.max(0, regulars - skips - excused) + makeups + trials;
          // const openSeats = Math.max(0, capacity - filled);

          // NEW LOGIC
          const instructorCount = s.offering.instructors.length;
          const capacity = capacityMap.get(s.offeringId) ?? 0;
          const skips = skipCountMap.get(s.id) ?? 0;
          const excused = excusedMap.get(s.id) ?? 0;

          // Calculate usage for ACTIVE students (regulars - skips - excused)
          // We need to filter enrollments to exclude skips/excused or just subtract counts?
          // Since weights vary (1:1=3, 3:1=1), we can't just subtract "skips" count if skips are unweighted.
          // Correct approach: Sum weights of PRESENT students.
          // PRESENT = All Active Enrollments MINUS Skipped/Excused Enrollments.

          let regularWeighted = 0;
          for (const enr of offeringEnrollments) {
            const isSkipped = skipMap.get(enr.id)?.has(s.id);
            const isExcused =
              attendanceMap.get(enr.id)?.get(s.id)?.status === "excused";

            if (!isSkipped && !isExcused) {
              const ratio = enr.classRatio || "3:1";
              regularWeighted +=
                ratio === "1:1" ? 3 : ratio === "2:1" ? 1.5 : 1;
            }
          }

          // Add Makeups/Trials (Assume standard weight 1.0 for now, or check if they have ratios?)
          // Makeups usually replace a spot. Trials replace a spot.
          // Assuming m/t = 1.0 weight unless schema allows specifying ratio for them (it doesn't clearly).
          // User said "1:1 takes up 3". If `MakeUp` has a student, that student has a level...
          // But `MakeUp` logic is complex. For now, let's treat Makeups/Trials as 1.0 unless we query their student level.
          // Wait, `makeUpsBySession` includes student info.
          // `trialsBySession` includes child info.

          const makeups = makeupCountMap.get(s.id) ?? 0; // Count only?
          const trials = trialCountMap.get(s.id) ?? 0; // Count only?

          // Let's refine Makeups/Trials if possible, but for MVP of this refactor, simple count + weighted regulars is a huge step.
          // However, if a 1:1 student is doing a makeup, they should take 3 slots.
          // The `makeUpBookings` query selected student level.
          const sessionMakeUps = makeUpsBySession.get(s.id) ?? [];
          let makeupWeighted = 0;
          for (const m of sessionMakeUps) {
            // We don't have ratio on student, only level. We can't infer ratio from level easily without map.
            // But existing enrollments have `classRatio`.
            // For now, let's stick to 1.0 for makeups/trials to be safe, or 1.0 per person.
            makeupWeighted += 1;
          }

          // Trials
          const sessionTrials = trialsBySession.get(s.id) ?? [];
          let trialsWeighted = 0;
          for (const t of sessionTrials) {
            if (t.status === "scheduled" || t.status === "attended") {
              trialsWeighted += 1;
            }
          }

          const totalFilled = regularWeighted + makeupWeighted + trialsWeighted;

          const dynamicMin = instructorCount >= 2 ? 5 : 0;
          const effectiveCapacity = Math.max(capacity, dynamicMin);
          const openSeats = Math.max(
            0,
            Math.floor(effectiveCapacity - totalFilled)
          );

          // Compatibility variables for return
          const finalCapacity = effectiveCapacity;
          const filled = totalFilled; // This is a number, possibly float.

          const makeUpsLite: MakeupLite[] = sessionMakeUps.map((m) => ({
            id: m.id,
            studentId: m.studentId,
            studentName: `${m.student.firstName} ${m.student.lastName}`,
            level: m.student.level,
            shortCode: m.student.shortCode,
            status: m.status,
          }));

          const trialsLite: TrialLite[] = sessionTrials.map((t) => ({
            id: t.id,
            childName: t.childName,
            childAge: t.childAge,
            parentPhone: t.parentPhone,
            status: t.status,
            notes: t.notes,
          }));

          const rosterRows = offeringEnrollments.map((e) => {
            const studentSkips = skipMap.get(e.id) ?? new Set();
            const skippedSessionIds = Array.from(studentSkips);
            const studentAttendance = attendanceMap.get(e.id);
            const attendance = studentAttendance?.get(s.id);

            const paid = e.invoiceLineItem
              ? e.invoiceLineItem.invoice.payments.reduce((acc, payment) => {
                  return acc + Number(payment.amount);
                }, 0)
              : null;

            const balance = e.invoiceLineItem
              ? Number(e.invoiceLineItem.invoice.totalAmount) - paid
              : null;

            return {
              enrollmentId: e.id,
              paymentStatus: e.invoiceLineItem
                ? e.invoiceLineItem.invoice.status
                : null,
              balance,
              invoiceNumber: e.invoiceLineItem
                ? e.invoiceLineItem.invoice.invoiceNumber
                : null,
              classRatio: e.classRatio,
              studentId: e.student.id,
              studentName: `${e.student.firstName} ${e.student.lastName}`,
              shortCode: e.student.shortCode,
              studentLevel: e.student.level,
              studentBirthDate: e.student.birthdate?.toISOString() ?? null,
              skippedSessionIds,
              notes: e.notes,
              attendance: attendance
                ? {
                    id: attendance.id,
                    status: attendance.status,
                  }
                : null,
            };
          });

          return {
            session: {
              id: s.id,
              date: s.date.toISOString(),
              offeringId: s.offeringId,
              offeringTitle: s.offering.title,
              offeringNotes: s.offering.notes,
              instructors: s.offering.instructors.map((i) => ({
                id: i.id,
                staffUserId: i.staffUserId,
                staffName: i.staffUser.fullName,
              })),
            },
            roster: rosterRows,
            capacity: finalCapacity,
            filled,
            openSeats,
            status: s.status,
            makeups: makeUpsLite,
            trials: trialsLite,
          };
        });

        return { date: `${date}T04:00:00.000Z`, rosters };
      });

    console.timeEnd("[Schedule] 5. Build Maps + Response");
    console.timeEnd(`[Schedule] Total Query Time`);

    return {
      meta: { weekday, startTime, endTime, term: termMeta },
      days,
    };
  }

  async getDailySchedule(termId: string, dateString: string) {
    console.time("[DailySchedule] Total Time");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      throw new BadRequestException("Invalid date format YYYY-MM-DD");
    }
    const targetDate = new Date(`${dateString}T04:00:00.000Z`);
    // Use UTC Day
    const dow = targetDate.getUTCDay();

    console.time("[DailySchedule] Fetch Data");
    const [term, offerings] = await Promise.all([
      this.prisma.term.findUnique({
        where: { id: termId },
        select: { id: true, name: true },
      }),
      this.prisma.classOffering.findMany({
        where: { termId, weekday: dow },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          capacity: true,
          notes: true,
          instructors: {
            where: { removedAt: null },
            select: {
              id: true,
              staffUserId: true,
              staffUser: { select: { fullName: true } },
            },
            orderBy: { assignedAt: "asc" },
          },
        },
        orderBy: { startTime: "asc" },
      }),
    ]);

    if (!term) throw new NotFoundException("Term not found");
    if (offerings.length === 0) return { date: dateString, classes: [] };

    const offeringIds = offerings.map((o) => o.id);

    // Get exact sessions for this day
    const sessions = await this.prisma.classSession.findMany({
      where: {
        offeringId: { in: offeringIds },
        date: targetDate,
      },
      select: {
        id: true,
        offeringId: true,
        status: true,
        notes: true,
      },
    });

    if (sessions.length === 0) {
      return { date: dateString, classes: [] };
    }

    const sessionIds = sessions.map((s) => s.id);
    const sessionMap = new Map(sessions.map((s) => [s.offeringId, s]));

    // Get Enrollments (Students)
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        offeringId: { in: offeringIds },
        status: "active",
      },
      select: {
        id: true,
        offeringId: true,
        studentId: true,
        classRatio: true,
        notes: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shortCode: true,
            level: true,
            birthdate: true,
          },
        },
      },
    });

    const enrollmentIds = enrollments.map((e) => e.id);
    const enrollmentsByOffering = new Map<string, typeof enrollments>();
    for (const e of enrollments) {
      const arr = enrollmentsByOffering.get(e.offeringId) ?? [];
      arr.push(e);
      enrollmentsByOffering.set(e.offeringId, arr);
    }

    // Dynamic Data
    const [attendance, makeups, trials, skips] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          classSessionId: { in: sessionIds },
          enrollmentId: { in: enrollmentIds },
        },
        select: { enrollmentId: true, status: true, id: true },
      }),
      this.prisma.makeUpBooking.findMany({
        where: { classSessionId: { in: sessionIds } },
        select: {
          id: true,
          classSessionId: true,
          status: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              level: true,
              birthdate: true,
              shortCode: true,
            },
          },
        },
      }),
      this.prisma.trialBooking.findMany({
        where: { classSessionId: { in: sessionIds } },
        select: {
          id: true,
          classSessionId: true,
          childName: true,
          childAge: true,
          status: true,
          notes: true,
        },
      }),
      this.prisma.enrollmentSkip.findMany({
        where: {
          classSessionId: { in: sessionIds },
          enrollmentId: { in: enrollmentIds },
        },
        select: { enrollmentId: true },
      }),
    ]);
    console.timeEnd("[DailySchedule] Fetch Data");

    const attendanceMap = new Map(attendance.map((a) => [a.enrollmentId, a]));
    const skipSet = new Set(skips.map((s) => s.enrollmentId));

    const makeupsBySession = new Map<string, typeof makeups>();
    for (const m of makeups) {
      const arr = makeupsBySession.get(m.classSessionId) ?? [];
      arr.push(m);
      makeupsBySession.set(m.classSessionId, arr);
    }

    const trialsBySession = new Map<string, typeof trials>();
    for (const t of trials) {
      const arr = trialsBySession.get(t.classSessionId) ?? [];
      arr.push(t);
      trialsBySession.set(t.classSessionId, arr);
    }

    // Transform Data
    const classes = offerings
      .map((offering) => {
        const session = sessionMap.get(offering.id);
        if (!session) return null;

        const sessionMakeups = makeupsBySession.get(session.id) ?? [];
        const sessionTrials = trialsBySession.get(session.id) ?? [];
        const sessionEnrollments = enrollmentsByOffering.get(offering.id) ?? [];

        // Count logic matching SlotBlock
        // WEIGHTED LOGIC
        let regularWeighted = 0;
        for (const enr of sessionEnrollments) {
          const isSkipped = skipSet.has(enr.id);
          // check attendance for excused? (attendanceMap stores by enrollmentId)
          const attendance = attendanceMap.get(enr.id);
          const isExcused = attendance && attendance.status === "excused"; // Note: attendanceMap value type check needed

          if (!isSkipped && !isExcused) {
            const ratio = enr.classRatio || "3:1";
            regularWeighted += ratio === "1:1" ? 3 : ratio === "2:1" ? 1.5 : 1;
          }
        }

        const activeMakeups = sessionMakeups.length;
        const activeTrials = sessionTrials.filter((t) =>
          ["scheduled", "attended"].includes(t.status)
        ).length;

        // Total filled (float)
        const filled = regularWeighted + activeMakeups + activeTrials;

        // Dynamic Capacity
        const instructorCount = offering.instructors.length;
        const dynamicMin = instructorCount >= 2 ? 5 : 0;
        const effectiveCapacity = Math.max(offering.capacity, dynamicMin);

        const roster = [
          ...sessionEnrollments.map((e) => {
            const isSkipped = skipSet.has(e.id);
            const att = attendanceMap.get(e.id);
            return {
              id: e.id, // Enrollment ID for updates
              type: "student",
              name: `${e.student.firstName} ${e.student.lastName}`,
              studentId: e.student.id,
              level: e.student.level,
              age: e.student.birthdate
                ? new Date().getFullYear() - e.student.birthdate.getFullYear()
                : null,
              status: att?.status ?? (isSkipped ? "skipped" : null),
              ratio: e.classRatio,
              notes: e.notes,
              isSkipped,
            };
          }),
          ...sessionMakeups.map((m) => ({
            id: m.id, // Makeup ID for updates
            type: "makeup",
            name: `${m.student.firstName} ${m.student.lastName}`,
            studentId: m.student.id,
            level: m.student.level,
            age: m.student.birthdate
              ? new Date().getFullYear() - m.student.birthdate.getFullYear()
              : null,
            status: m.status,
            ratio: "3:1",
            notes: "Makeup",
            isSkipped: false,
          })),
          ...sessionTrials.map((t) => ({
            id: t.id, // Trial ID for updates
            type: "trial",
            name: t.childName,
            studentId: null,
            level: null,
            age: t.childAge,
            status: t.status,
            ratio: "3:1",
            notes: t.notes ?? "Trial",
            isSkipped: false,
          })),
        ].sort((a, b) => a.name.localeCompare(b.name));

        return {
          id: session.id, // Session ID needed usually, but here we used cls.id which is session.id
          offeringId: offering.id,
          title: offering.title,
          time: `${offering.startTime}-${offering.endTime}`,
          instructors: offering.instructors.map((i) => ({
            id: i.id,
            staffUserId: i.staffUserId,
            staffName: i.staffUser.fullName,
          })),
          capacity: offering.capacity,
          filled,
          roster,
        };
      })
      .filter(Boolean);

    console.timeEnd("[DailySchedule] Total Time");

    return {
      date: dateString,
      termName: term.name,
      classes: classes,
    };
  }

  async getTermAvailability(termId: string, level?: string) {
    // 1. Fetch all offerings + sessions + enrollments + makeups in bulk
    // This is a heavy query but necessary to compute accurate availability
    const offerings = await this.prisma.classOffering.findMany({
      where: {
        termId,
        ...(level
          ? {
              OR: [
                { title: { contains: level, mode: "insensitive" } },
                // If filtering by level, we might want to check the offering title usually
              ],
            }
          : {}),
      },
      include: {
        instructors: {
          select: { id: true },
          where: { removedAt: null },
        },
        sessions: {
          orderBy: { date: "asc" },
          select: {
            id: true,
            date: true,
            status: true,
            makeUps: {
              select: { id: true }, // Count only
              where: { status: { not: "cancelled" } },
            },
            enrollmentSkips: {
              select: { enrollmentId: true },
            },
            attendance: {
              // We need to know if someone is excused effectively?
              // Usually capacity checks care about active enrollments mostly.
              // But our robust check excludes excused. Let's include it.
              where: { status: "excused" },
              select: { enrollmentId: true },
            },
          },
        },
        enrollments: {
          where: { status: "active" },
          select: {
            id: true,
            classRatio: true,
          },
        },
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    // 2. Process in-memory to find open slots
    // Group by Weekday
    const byWeekday: Record<
      number,
      Array<{
        offeringId: string;
        title: string;
        time: string;
        capacity: number;
        sessions: Array<{
          date: string;
          openSeats: number;
        }>;
      }>
    > = {};

    for (const off of offerings) {
      const availableSessions: Array<{ date: string; openSeats: number }> = [];
      const baseCap = off.capacity;
      const instructorCount = off.instructors.length;

      // Dynamic rule: 2+ instructors -> min 5 slots
      const dynamicMin = instructorCount >= 2 ? 5 : 0;
      const effectiveCapacity = Math.max(baseCap, dynamicMin);

      for (const sess of off.sessions) {
        if (sess.status === "canceled") continue;

        // Calculate Usage
        let filled = 0;

        // Enrollments (exclude skips/excused)
        const skipSet = new Set(
          sess.enrollmentSkips.map((s) => s.enrollmentId)
        );
        const excusedSet = new Set(sess.attendance.map((a) => a.enrollmentId));

        for (const enr of off.enrollments) {
          if (skipSet.has(enr.id) || excusedSet.has(enr.id)) continue;

          const ratio = enr.classRatio || "3:1";
          if (ratio === "1:1") filled += 3;
          else if (ratio === "2:1") filled += 1.5;
          else filled += 1;
        }

        // Add Makeups (Assume 1.0 weight)
        filled += sess.makeUps.length;

        const openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));

        if (openSeats > 0) {
          availableSessions.push({
            date: sess.date.toISOString().split("T")[0], // YYYY-MM-DD (UTC)
            openSeats,
          });
        }
      }

      if (availableSessions.length > 0) {
        const wd = off.weekday;
        if (!byWeekday[wd]) byWeekday[wd] = [];
        byWeekday[wd].push({
          offeringId: off.id,
          title: off.title,
          time: `${off.startTime}-${off.endTime}`,
          capacity: effectiveCapacity, // Return effective capacity
          sessions: availableSessions,
        });
      }
    }

    return byWeekday;
  }
}
