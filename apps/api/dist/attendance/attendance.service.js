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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(data, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        // Get existing attendance record if it exists
        const existing = await this.prisma.attendance.findUnique({
            where: {
                enrollmentId_classSessionId: {
                    classSessionId: data.classSessionId,
                    enrollmentId: data.enrollmentId,
                },
            },
        });
        if (!data.status) {
            // UNMARK: Delete the attendance record
            if (existing) {
                await this.prisma.attendance.delete({
                    where: {
                        enrollmentId_classSessionId: {
                            classSessionId: data.classSessionId,
                            enrollmentId: data.enrollmentId,
                        },
                    },
                });
                // Log the deletion
                await this.prisma.auditLog.create({
                    data: {
                        staffId: staffUser.id,
                        action: "Unmark Attendance",
                        entityType: "Attendance",
                        entityId: existing.id,
                        changes: {
                            status: { from: existing.status, to: null },
                        },
                        metadata: {
                            enrollmentId: data.enrollmentId,
                            classSessionId: data.classSessionId,
                            notes: existing.notes,
                            markedBy: existing.markedBy,
                            markedAt: existing.markedAt?.toISOString(),
                        },
                    },
                });
            }
        }
        else {
            // CREATE or UPDATE attendance
            const attendance = await this.prisma.attendance.upsert({
                where: {
                    enrollmentId_classSessionId: {
                        classSessionId: data.classSessionId,
                        enrollmentId: data.enrollmentId,
                    },
                },
                update: {
                    status: data.status,
                    updatedAt: new Date(),
                    updatedBy: staffUser?.id ?? null,
                },
                create: {
                    classSessionId: data.classSessionId,
                    enrollmentId: data.enrollmentId,
                    status: data.status,
                    notes: data.notes,
                    markedAt: new Date(),
                    markedBy: staffUser?.id ?? null,
                },
            });
            // Log the change
            await this.prisma.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: existing ? "Update Attendance" : "Mark Attendance",
                    entityType: "Attendance",
                    entityId: attendance.id,
                    changes: existing
                        ? {
                            status: { from: existing.status, to: attendance.status },
                            ...(existing.notes !== data.notes && {
                                notes: { from: existing.notes, to: data.notes },
                            }),
                        }
                        : {
                            status: { from: null, to: attendance.status },
                        },
                    metadata: {
                        enrollmentId: data.enrollmentId,
                        classSessionId: data.classSessionId,
                    },
                },
            });
        }
        return { success: true };
    }
    async updateMakeup(data, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        // Get existing make-up booking
        const existing = await this.prisma.makeUpBooking.findUnique({
            where: { id: data.makeUpId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Make-up booking not found");
        }
        if (!data.status) {
            // CANCEL/DELETE: Remove the make-up booking
            await this.prisma.makeUpBooking.delete({
                where: { id: data.makeUpId },
            });
            // Log the deletion
            await this.prisma.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Cancel Makeup",
                    entityType: "MakeUpBooking",
                    entityId: existing.id,
                    changes: {
                        status: { from: existing.status, to: null },
                    },
                    metadata: {
                        studentId: existing.studentId,
                        sessionId: existing.classSessionId,
                    },
                },
            });
        }
        else {
            // UPDATE status
            const updated = await this.prisma.makeUpBooking.update({
                where: { id: data.makeUpId },
                data: {
                    status: data.status,
                    updatedBy: staffUser?.id ?? null,
                },
            });
            // Log the change
            await this.prisma.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Update Makeup Status",
                    entityType: "MakeUpBooking",
                    entityId: updated.id,
                    changes: {
                        status: { from: existing.status, to: updated.status },
                    },
                    metadata: {
                        studentId: existing.studentId,
                        sessionId: existing.classSessionId,
                    },
                },
            });
        }
        return { success: true };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
