"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const TZ = "America/Toronto";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function estDayKey(d) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(d);
}
function estWeekday(d) {
    const label = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        weekday: "short",
    }).format(d);
    return DAYS.indexOf(label);
}
//gen function for dates
function* weeklyDates(start, end, weekday) {
    const cur = new Date(start);
    while (estWeekday(cur) !== weekday) {
        cur.setDate(cur.getDate() + 1);
    }
    const endKey = estDayKey(end);
    while (true) {
        const curKey = estDayKey(cur);
        if (curKey > endKey)
            break;
        yield new Date(curKey);
        cur.setDate(cur.getDate() + 7);
    }
}
function computeEnd(start, duration) {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + duration;
    const hh = Math.floor((total % (24 * 60)) / 60.0);
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
let TermsService = class TermsService {
    //Create a prismaservice to use
    constructor(prisma) {
        this.prisma = prisma;
    }
    slugify(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
    async isUniqueSlug(base) {
        let candidate = base || "term";
        let n = 1;
        while (await this.prisma.term.findUnique({ where: { slug: candidate } })) {
            n++;
            candidate = `${base}-${n}`;
        }
        return candidate;
    }
    async createTermWithSchedule(input, user) {
        const { name, slug, startDate, endDate, weeks = 8, templates } = input;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const term = await this.prisma.$transaction(async (tx) => {
            const finalSlug = slug ?? (await this.isUniqueSlug(this.slugify(name)));
            //Create term
            const newTerm = await tx.term.create({
                data: { name, slug: finalSlug, startDate: start, endDate: end, createdBy: staffUser?.id ?? null },
            });
            const audit = await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Create Term",
                    entityType: "Term",
                    entityId: newTerm.id,
                    metadata: {
                        title: newTerm.name,
                    }
                }
            });
            //Create Offerings (Day and Time Slot)
            const offerings = await Promise.all(templates.map((t) => tx.classOffering.create({
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
            })));
            //Create ClassSessions (Individual DATES of the classes)
            const allSessions = [];
            offerings.forEach((offering, i) => {
                const template = templates[i];
                const dates = weeklyDates(startDate, endDate, template.weekday);
                let count = 0;
                for (const d of dates) {
                    allSessions.push({
                        offeringId: offering.id,
                        date: d,
                        status: client_1.SessionStatus.scheduled,
                        notes: null,
                    });
                    if (++count >= weeks)
                        break;
                }
            });
            await tx.classSession.createMany({
                data: allSessions,
            });
            return newTerm;
        }, { maxWait: 10000, timeout: 20000 });
        return term.id;
    }
    async getAllTerms() {
        const terms = await this.prisma.term.findMany({
            select: {
                id: true,
                name: true,
            },
        });
        return terms;
    }
    async getTermTitle(termId) {
        const term = await this.prisma.term.findUnique({
            where: { id: termId },
            select: { name: true },
        });
        return term?.name ?? null;
    }
    async getDefaultSlots(termId) {
        // run 7 findFirst queries in parallel (Sun..Sat)
        const queries = Array.from({ length: 7 }, (_, i) => this.prisma.classOffering.findFirst({
            where: { termId, weekday: i },
            orderBy: [{ startTime: "asc" }],
            select: { startTime: true, endTime: true },
        }));
        const results = await Promise.all(queries);
        const result = results.map((first) => (first ? `${first.startTime}-${first.endTime}` : null));
        return result;
    }
    async getSlotsForWeekday(termId, weekday) {
        const sessions = await this.prisma.classOffering.findMany({
            where: { termId, weekday },
            select: { startTime: true, endTime: true },
            distinct: ["startTime", "endTime"],
            orderBy: [{ startTime: "asc" }],
        });
        return sessions.map((s) => `${s.startTime}-${s.endTime}`);
    }
    async slotByWeekdayAndTime(weekday, termId, startTime, endTime) {
        console.time(`[Schedule] Total Query Time`);
        if (weekday < 0 || weekday > 6) {
            throw new common_1.BadRequestException("Not a real weekday");
        }
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            throw new common_1.BadRequestException("Time is not HH:MM");
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
            throw new common_1.NotFoundException("Term Does Not Exist");
        }
        const termMeta = {
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
                            orderBy: { assignedAt: 'asc' },
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
        const sessionsByDate = new Map();
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
        const enrollmentsByOffering = new Map();
        for (const e of enrollments) {
            const arr = enrollmentsByOffering.get(e.offeringId) ?? [];
            arr.push(e);
            enrollmentsByOffering.set(e.offeringId, arr);
        }
        const enrollmentIds = enrollments.map((e) => e.id);
        // Step 4: Fetch all remaining data IN PARALLEL
        console.time("[Schedule] 4. Parallel Fetch (Attendance/Skips/Makeups/Counts)");
        const [attendanceRecords, skipRecords, makeUpBookings, trialBookings, skipCounts, excusedCounts, makeupCounts, trialCounts,] = await Promise.all([
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
                by: ['classSessionId'],
                where: {
                    classSessionId: { in: sessionIds },
                    status: { in: ['scheduled', 'attended'] },
                },
                _count: { _all: true },
            }),
        ]);
        console.timeEnd("[Schedule] 4. Parallel Fetch (Attendance/Skips/Makeups/Counts)");
        // Build maps
        console.time("[Schedule] 5. Build Maps + Response");
        // Build attendance map
        const attendanceMap = new Map();
        for (const a of attendanceRecords) {
            if (!attendanceMap.has(a.enrollmentId)) {
                attendanceMap.set(a.enrollmentId, new Map());
            }
            attendanceMap.get(a.enrollmentId).set(a.classSessionId, a);
        }
        // Build skip map
        const skipMap = new Map();
        for (const skip of skipRecords) {
            if (!skipMap.has(skip.enrollmentId)) {
                skipMap.set(skip.enrollmentId, new Set());
            }
            skipMap.get(skip.enrollmentId).add(skip.classSessionId);
        }
        // Build makeup map
        const makeUpsBySession = new Map();
        for (const m of makeUpBookings) {
            const arr = makeUpsBySession.get(m.classSessionId) ?? [];
            arr.push(m);
            makeUpsBySession.set(m.classSessionId, arr);
        }
        // Build trial map
        const trialsBySession = new Map();
        for (const t of trialBookings) {
            const arr = trialsBySession.get(t.classSessionId) ?? [];
            arr.push(t);
            trialsBySession.set(t.classSessionId, arr);
        }
        // Build count maps
        const skipCountMap = new Map(skipCounts.map((x) => [x.classSessionId, x._count._all]));
        const excusedMap = new Map(excusedCounts.map((x) => [x.classSessionId, x._count._all]));
        const makeupCountMap = new Map(makeupCounts.map((x) => [x.classSessionId, x._count._all]));
        const trialCountMap = new Map(trialCounts.map((x) => [x.classSessionId, x._count._all]));
        // Build response
        const days = Array.from(sessionsByDate.entries())
            .sort()
            .map(([date, sessionList]) => {
            const rosters = sessionList.map((s) => {
                const offeringEnrollments = enrollmentsByOffering.get(s.offeringId) ?? [];
                const regulars = offeringEnrollments.length;
                const skips = skipCountMap.get(s.id) ?? 0;
                const makeups = makeupCountMap.get(s.id) ?? 0;
                const trials = trialCountMap.get(s.id) ?? 0;
                const excused = excusedMap.get(s.id) ?? 0;
                const capacity = capacityMap.get(s.offeringId) ?? 0;
                const filled = Math.max(0, regulars - skips - excused) + makeups + trials;
                const openSeats = Math.max(0, capacity - filled);
                const sessionMakeUps = makeUpsBySession.get(s.id) ?? [];
                const sessionTrials = trialsBySession.get(s.id) ?? [];
                const makeUpsLite = sessionMakeUps.map((m) => ({
                    id: m.id,
                    studentId: m.studentId,
                    studentName: `${m.student.firstName} ${m.student.lastName}`,
                    level: m.student.level,
                    shortCode: m.student.shortCode,
                    status: m.status,
                }));
                const trialsLite = sessionTrials.map((t) => ({
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
                    return {
                        enrollmentId: e.id,
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
                        instructors: s.offering.instructors.map(i => ({
                            id: i.id,
                            staffUserId: i.staffUserId,
                            staffName: i.staffUser.fullName,
                        })),
                    },
                    roster: rosterRows,
                    capacity,
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
};
exports.TermsService = TermsService;
exports.TermsService = TermsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TermsService);
