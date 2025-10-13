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
exports.OfferingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OfferingsService = class OfferingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateOfferingInfo(offeringId, body, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const offering = await this.prisma.classOffering.findUnique({
            where: { id: offeringId },
        });
        if (!offering)
            throw new common_1.NotFoundException("Offering DNE");
        const updatedOffering = await this.prisma.classOffering.update({
            where: { id: offeringId },
            data: {
                title: body.title,
            }
        });
        await this.prisma.auditLog.create({
            data: {
                staffId: staffUser.id,
                action: "Update Offering Info",
                entityType: "ClassOffering",
                entityId: updatedOffering.id,
                changes: {
                    status: {
                        from: { title: offering.title },
                        to: { title: updatedOffering.title },
                    },
                },
                metadata: {
                    offeringId: updatedOffering.id,
                },
            },
        });
        return { success: true };
    }
    async getOfferingsForTransfer(termId, excludeOfferingId, level) {
        const offerings = await this.prisma.classOffering.findMany({
            where: {
                termId,
                id: { not: excludeOfferingId },
                ...(level ? { title: { contains: level, mode: "insensitive" } } : {}),
            },
            include: {
                term: true,
                _count: {
                    select: { enrollments: { where: { status: "active" } } },
                },
                sessions: {
                    orderBy: { date: "asc" },
                    select: {
                        id: true,
                        date: true,
                    },
                },
            },
            orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        });
        return offerings;
    }
};
exports.OfferingsService = OfferingsService;
exports.OfferingsService = OfferingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OfferingsService);
