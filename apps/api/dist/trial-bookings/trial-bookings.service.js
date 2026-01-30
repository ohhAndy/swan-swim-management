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
exports.TrialBookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TrialBookingsService = class TrialBookingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTrialBooking(classSessionId, childName, childAge, parentPhone, notes, classRatio, createdBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: createdBy.authId },
        });
        if (!user)
            return;
        // Verify session exists
        const session = await this.prisma.classSession.findUnique({
            where: { id: classSessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException("Class session not found");
        }
        if (childAge < 0 || childAge > 18) {
            throw new common_1.BadRequestException("Invalid age");
        }
        // Create trial booking with audit log
        return this.prisma.$transaction(async (tx) => {
            const trial = await tx.trialBooking.create({
                data: {
                    classSessionId,
                    childName,
                    childAge,
                    parentPhone,
                    notes,
                    status: "scheduled",
                    createdBy: user.id,
                    classRatio: classRatio || "3:1",
                },
                include: {
                    classSession: {
                        select: {
                            id: true,
                            date: true,
                            offering: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                    createdByUser: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: "Create Trial Booking",
                    entityType: "TrialBooking",
                    entityId: trial.id,
                    metadata: {
                        childName,
                        childAge,
                        parentPhone,
                        sessionDate: trial.classSession.date.toISOString(),
                        offeringTitle: trial.classSession.offering.title,
                    },
                },
            });
            return trial;
        });
    }
    async updateTrialStatus(trialId, status, updatedBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: updatedBy.authId },
        });
        if (!user)
            return;
        const trial = await this.prisma.trialBooking.findUnique({
            where: { id: trialId },
            include: {
                classSession: {
                    select: {
                        date: true,
                        offering: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
        });
        if (!trial) {
            throw new common_1.NotFoundException("Trial booking not found");
        }
        // Don't allow status changes on converted trials
        if (trial.status === "converted" && status !== "converted") {
            throw new common_1.BadRequestException("Cannot change status of converted trial");
        }
        // Check if the incoming status is empty strings (deletion request)
        // We cast to string because the enum won't technically allow empty string, but runtime value from UI might be empty
        if (!status || status === "") {
            return this.prisma.$transaction(async (tx) => {
                await tx.auditLog.create({
                    data: {
                        staffId: user.id,
                        action: "Delete Trial Booking",
                        entityType: "TrialBooking",
                        entityId: trialId,
                        metadata: {
                            childName: trial.childName,
                            childAge: trial.childAge,
                            parentPhone: trial.parentPhone,
                            status: trial.status,
                        },
                    },
                });
                return tx.trialBooking.delete({
                    where: { id: trialId },
                });
            });
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.trialBooking.update({
                where: { id: trialId },
                data: {
                    status,
                    updatedBy: user.id,
                },
                include: {
                    updatedByUser: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: "Update Trial Status",
                    entityType: "TrialBooking",
                    entityId: trialId,
                    metadata: {
                        childName: trial.childName,
                        oldStatus: trial.status,
                        newStatus: status,
                        sessionDate: trial.classSession.date.toISOString(),
                        offeringTitle: trial.classSession.offering.title,
                    },
                },
            });
            return updated;
        });
    }
    async convertToStudent(trialId, studentId, convertedBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: convertedBy.authId },
        });
        if (!user)
            return;
        const trial = await this.prisma.trialBooking.findUnique({
            where: { id: trialId },
        });
        if (!trial) {
            throw new common_1.NotFoundException("Trial booking not found");
        }
        if (trial.status === "converted") {
            throw new common_1.BadRequestException("Trial already converted");
        }
        // Verify student exists
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException("Student not found");
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.trialBooking.update({
                where: { id: trialId },
                data: {
                    status: "converted",
                    convertedAt: new Date(),
                    convertedBy: user.id,
                    convertedToStudentId: studentId,
                },
                include: {
                    convertedByUser: {
                        select: {
                            fullName: true,
                        },
                    },
                    convertedToStudent: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: "Convert Trial to Student",
                    entityType: "TrialBooking",
                    entityId: trialId,
                    metadata: {
                        trialChildName: trial.childName,
                        studentId,
                        studentName: `${student.firstName} ${student.lastName}`,
                    },
                },
            });
            return updated;
        });
    }
    async deleteTrialBooking(trialId, deletedBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: deletedBy.authId },
        });
        if (!user)
            return;
        const trial = await this.prisma.trialBooking.findUnique({
            where: { id: trialId },
        });
        if (!trial) {
            throw new common_1.NotFoundException("Trial booking not found");
        }
        if (trial.status === "converted") {
            throw new common_1.BadRequestException("Cannot delete converted trial");
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: "Delete Trial Booking",
                    entityType: "TrialBooking",
                    entityId: trialId,
                    metadata: {
                        childName: trial.childName,
                        childAge: trial.childAge,
                        parentPhone: trial.parentPhone,
                        status: trial.status,
                    },
                },
            });
            return tx.trialBooking.delete({
                where: { id: trialId },
            });
        });
    }
    async findUpcoming() {
        return this.prisma.trialBooking.findMany({
            where: {
                classSession: {
                    date: {
                        gte: new Date(),
                    },
                },
                status: "scheduled",
            },
            include: {
                classSession: {
                    select: {
                        date: true,
                        offering: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                classSession: {
                    date: "asc",
                },
            },
        });
    }
    async findPast() {
        return this.prisma.trialBooking.findMany({
            where: {
                OR: [
                    {
                        classSession: {
                            date: {
                                lt: new Date(),
                            },
                        },
                    },
                    {
                        status: {
                            not: "scheduled",
                        },
                    },
                ],
            },
            include: {
                classSession: {
                    select: {
                        date: true,
                        offering: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                classSession: {
                    date: "desc",
                },
            },
        });
    }
    async getStats() {
        const total = await this.prisma.trialBooking.count();
        const converted = await this.prisma.trialBooking.count({
            where: { status: "converted" },
        });
        const scheduled = await this.prisma.trialBooking.count({
            where: { status: "scheduled" },
        });
        const attended = await this.prisma.trialBooking.count({
            where: { status: "attended" },
        });
        const noshow = await this.prisma.trialBooking.count({
            where: { status: "noshow" },
        });
        const cancelled = await this.prisma.trialBooking.count({
            where: { status: "cancelled" },
        });
        const notConverted = attended + noshow + cancelled;
        return {
            total,
            converted,
            scheduled,
            attended,
            noshow,
            cancelled,
            notConverted,
            conversionRate: attended + converted > 0
                ? Math.round((converted / (attended + converted)) * 100)
                : 0,
        };
    }
};
exports.TrialBookingsService = TrialBookingsService;
exports.TrialBookingsService = TrialBookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrialBookingsService);
