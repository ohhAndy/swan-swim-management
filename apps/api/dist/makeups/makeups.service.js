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
exports.MakeupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sessions_helpers_1 = require("../sessions/sessions.helpers");
let MakeupsService = class MakeupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scheduleMakeUp(input, user) {
        const { studentId, classSessionId, notes } = input;
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        return this.prisma.$transaction(async (tx) => {
            const session = await tx.classSession.findUnique({
                where: { id: classSessionId },
                include: { offering: { select: { id: true, capacity: true } } },
            });
            if (!session)
                throw new common_1.BadRequestException("Session not found");
            const dup = await tx.makeUpBooking.findUnique({
                where: { studentId_classSessionId: { studentId, classSessionId } },
                select: { id: true },
            });
            if (dup)
                throw new common_1.BadRequestException("Already booked a makeup here!");
            if (await (0, sessions_helpers_1.hasTimeConflict)(tx, studentId, session.date)) {
                throw new common_1.BadRequestException("Has Time Conflict!");
            }
            const { expectedRegulars, makeUpCount } = await (0, sessions_helpers_1.countUsedSeatsForSession)(tx, session.offeringId, session.date);
            const used = expectedRegulars + makeUpCount;
            if (used >= session.offering.capacity)
                throw new common_1.BadRequestException("No seats left");
            const booking = await tx.makeUpBooking.create({
                data: {
                    studentId,
                    classSessionId,
                    status: "scheduled",
                    notes: notes ?? null,
                    createdBy: staffUser?.id ?? null,
                },
                select: { id: true, status: true, student: true, classSession: true },
            });
            const audit = await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Schedule Makeup",
                    entityType: "MakeUpBooking",
                    entityId: booking.id,
                    metadata: {
                        studentFirstName: booking.student.firstName,
                        studentLastName: booking.student.lastName,
                        studentBirthDate: booking.student.birthdate,
                        studentLevel: booking.student.level,
                        date: booking.classSession.date,
                    }
                },
            });
            return { makeUpId: booking.id, status: booking.status };
        });
    }
};
exports.MakeupsService = MakeupsService;
exports.MakeupsService = MakeupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MakeupsService);
