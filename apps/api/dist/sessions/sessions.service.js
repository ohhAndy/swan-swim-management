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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seatsForSlot(params) {
        const date = new Date(`${params.dateOnly}T00:00:00.000Z`);
        const offerings = await this.prisma.classOffering.findMany({
            where: {
                termId: params.termId,
                weekday: params.weekday,
                startTime: params.startTime,
            },
            select: { id: true, title: true, capacity: true },
        });
        if (offerings.length === 0)
            return [];
        const sessions = await this.prisma.classSession.findMany({
            where: { offeringId: { in: offerings.map((o) => o.id) }, date },
            select: { id: true, offeringId: true },
        });
        const sessionByOffering = new Map(sessions.map((s) => [s.offeringId, s]));
        const sessionIds = sessions.map(s => s.id);
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
            },
        });
        const makeups = await this.prisma.makeUpBooking.findMany({
            where: {
                classSessionId: { in: sessions.map((s) => s.id) },
                status: { in: ["scheduled", "attended"] },
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
        const makeupsBySession = makeups.reduce((acc, m) => {
            const k = m.classSessionId;
            const name = `${m.student.firstName} ${m.student.lastName}`;
            (acc[k] ??= []).push({
                id: m.student.id,
                name,
                code: m.student.shortCode ?? null,
            });
            return acc;
        }, {});
        const skipsBySession = new Map();
        if (sessionIds.length) {
            const skips = await this.prisma.enrollmentSkip.findMany({
                where: { classSessionId: { in: sessionIds } },
                select: { classSessionId: true, enrollmentId: true },
            });
            for (const s of skips) {
                const set = skipsBySession.get(s.classSessionId) ?? new Set();
                set.add(s.enrollmentId);
                skipsBySession.set(s.classSessionId, set);
            }
        }
        const excusedBySession = new Map();
        if (sessionIds.length) {
            const excused = await this.prisma.attendance.findMany({
                where: { classSessionId: { in: sessionIds }, status: "excused" },
                select: { classSessionId: true, enrollmentId: true },
            });
            for (const e of excused) {
                const set = excusedBySession.get(e.classSessionId) ?? new Set();
                set.add(e.enrollmentId);
                excusedBySession.set(e.classSessionId, set);
            }
        }
        return offerings.map((o) => {
            const ses = sessionByOffering.get(o.id);
            const skipSet = ses ? (skipsBySession.get(ses.id) ?? new Set()) : new Set();
            const excusedSet = ses ? (excusedBySession.get(ses.id) ?? new Set()) : new Set();
            const regs = regulars
                .filter((r) => r.offeringId === o.id)
                .filter((r) => (ses ? !skipSet.has(r.id) : true))
                .filter((r) => (ses ? !excusedSet.has(r.id) : true))
                .map((r) => ({
                type: "filled",
                studentId: r.student.id,
                name: `${r.student.firstName} ${r.student.lastName}`,
                code: r.student.shortCode ?? null,
            }));
            const mUps = ses?.id
                ? (makeupsBySession[ses.id] ?? []).map((s) => ({
                    type: "filled",
                    studentId: s.id,
                    name: s.name,
                    code: s.code,
                    makeup: true,
                }))
                : [];
            const filled = [...regs, ...mUps];
            const emptyCount = Math.max(0, o.capacity - filled.length);
            return {
                offeringId: o.id,
                offeringTitle: o.title,
                capacity: o.capacity,
                sessionId: ses?.id ?? null,
                date: params.dateOnly,
                seats: [
                    ...filled,
                    ...Array.from({ length: emptyCount }).map(() => ({ type: "empty" })),
                ],
            };
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
