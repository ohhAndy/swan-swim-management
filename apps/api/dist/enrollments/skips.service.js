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
exports.SkipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SkipsService = class SkipsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addSkip(enrollmentId, dto) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { id: true, offeringId: true, status: true },
        });
        if (!enrollment)
            throw new common_1.NotFoundException("Enrollment not found");
        const session = await this.prisma.classSession.findUnique({
            where: { id: dto.classSessionId },
            select: { id: true, offeringId: true, status: true },
        });
        if (!session)
            throw new common_1.NotFoundException("Session not found");
        if (enrollment.offeringId !== session.offeringId)
            throw new common_1.BadRequestException("Session and Enrollment's offeringId do not match");
        if (enrollment.status !== "active")
            throw new common_1.BadRequestException("Only active enrollments can be skipped");
        if (session.status === "canceled")
            throw new common_1.BadRequestException("Cannot skip a cancelled session");
        const skip = await this.prisma.enrollmentSkip.upsert({
            where: { enrollmentId_classSessionId: { enrollmentId, classSessionId: dto.classSessionId } },
            update: { reason: dto.reason ?? null },
            create: { enrollmentId, classSessionId: dto.classSessionId, reason: dto.reason ?? null },
            select: { id: true, enrollmentId: true, classSessionId: true, reason: true, createdAt: true, updatedAt: true },
        });
        return skip;
    }
    async deleteSkip(enrollmentId, classSessionId) {
        try {
            await this.prisma.enrollmentSkip.delete({
                where: { enrollmentId_classSessionId: { enrollmentId, classSessionId } },
            });
        }
        catch { }
        return { ok: true };
    }
};
exports.SkipsService = SkipsService;
exports.SkipsService = SkipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkipsService);
