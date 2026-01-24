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
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EnrollmentsService = class EnrollmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateRemarks(enrollmentId, body, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const currEnrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: {
                notes: true,
            },
        });
        if (!currEnrollment)
            throw new common_1.NotFoundException("Enrollment DNE");
        if (currEnrollment) {
            const updated = await this.prisma.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    notes: body.remarks,
                },
            });
            await this.prisma.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Update Remarks",
                    entityType: "Enrollment",
                    entityId: updated.id,
                    changes: {
                        status: { from: currEnrollment.notes, to: updated.notes },
                    },
                },
            });
        }
        return {
            success: true,
            notes: body.remarks,
        };
    }
    async transferEnrollment(enrollmentId, dto, user) {
        const { targetOfferingId, skippedSessionIds, transferNotes } = dto;
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const currEnrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                offering: {
                    include: { term: true },
                },
                student: true,
                invoiceLineItem: true,
            },
        });
        if (!currEnrollment)
            throw new common_1.NotFoundException("Enrollment DNE");
        if (currEnrollment.status !== "active")
            throw new common_1.BadRequestException("Enrollment is not active!");
        const targetOffering = await this.prisma.classOffering.findUnique({
            where: { id: targetOfferingId },
            include: { term: true },
        });
        if (!targetOffering)
            throw new common_1.NotFoundException("Target offering not found");
        if (targetOffering.termId !== currEnrollment.offering.termId) {
            throw new common_1.BadRequestException("Can only transfer within the same term");
        }
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                offeringId_studentId: {
                    offeringId: targetOfferingId,
                    studentId: currEnrollment.studentId,
                },
            },
        });
        if (existingEnrollment)
            throw new common_1.BadRequestException("Student already enrolled");
        // Fetch sessions for both offerings to map them by index
        const [oldSessions, newSessions] = await Promise.all([
            this.prisma.classSession.findMany({
                where: { offeringId: currEnrollment.offeringId },
                orderBy: { date: "asc" },
            }),
            this.prisma.classSession.findMany({
                where: { offeringId: targetOfferingId },
                orderBy: { date: "asc" },
            }),
        ]);
        // Fetch existing attendance
        const oldAttendance = await this.prisma.attendance.findMany({
            where: { enrollmentId: enrollmentId },
        });
        return await this.prisma.$transaction(async (tx) => {
            // Create new enrollment
            const newEnrollment = await tx.enrollment.create({
                data: {
                    studentId: currEnrollment.studentId,
                    offeringId: targetOfferingId,
                    status: "active",
                    enrollDate: new Date(),
                    transferredFromId: enrollmentId,
                    createdBy: staffUser.id,
                    classRatio: currEnrollment.classRatio,
                },
            });
            // Map sessions and identify which new sessions should have attendance vs skips
            const attendanceToCreate = [];
            const finalSkippedSessionIds = new Set(skippedSessionIds);
            oldSessions.forEach((oldSession, index) => {
                const newSession = newSessions[index];
                if (!newSession)
                    return;
                const att = oldAttendance.find((a) => a.classSessionId === oldSession.id);
                if (att) {
                    // If we have attendance, we transfer it and REMOVE from skips
                    attendanceToCreate.push({
                        enrollmentId: newEnrollment.id,
                        classSessionId: newSession.id,
                        status: att.status,
                        notes: `[Transferred] ${att.notes || ""}`.trim(),
                        markedBy: staffUser.id,
                        markedAt: new Date(),
                    });
                    finalSkippedSessionIds.delete(newSession.id);
                }
            });
            // Create transferred attendance records
            if (attendanceToCreate.length > 0) {
                await tx.attendance.createMany({
                    data: attendanceToCreate,
                });
            }
            // Create skips for new enrollment (only for those WITHOUT attendance)
            if (finalSkippedSessionIds.size > 0) {
                await tx.enrollmentSkip.createMany({
                    data: Array.from(finalSkippedSessionIds).map((sessionId) => ({
                        enrollmentId: newEnrollment.id,
                        classSessionId: sessionId,
                    })),
                });
            }
            // Update old enrollment to transferred status
            await tx.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    status: "transferred",
                    transferredToId: newEnrollment.id,
                    transferredAt: new Date(),
                    transferNotes: transferNotes || null,
                    transferredBy: staffUser?.id ?? null,
                },
            });
            // Transfer invoice line item if it exists
            if (currEnrollment.invoiceLineItem) {
                await tx.invoiceLineItem.update({
                    where: { id: currEnrollment.invoiceLineItem.id },
                    data: {
                        enrollmentId: newEnrollment.id,
                    },
                });
            }
            // Create audit log for transfer
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Transfer Enrollment",
                    entityType: "Enrollment",
                    entityId: enrollmentId,
                    changes: {
                        status: { from: "active", to: "transferred" },
                        offeringId: {
                            from: currEnrollment.offeringId,
                            to: targetOfferingId,
                        },
                    },
                    metadata: {
                        studentId: currEnrollment.studentId,
                        studentName: `${currEnrollment.student.firstName} ${currEnrollment.student.lastName}`,
                        oldOfferingId: currEnrollment.offeringId,
                        newOfferingId: targetOfferingId,
                        newEnrollmentId: newEnrollment.id,
                        skippedSessionIds: skippedSessionIds,
                        transferNotes: transferNotes || null,
                    },
                },
            });
            // Create audit log for new enrollment creation
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Create Enrollment",
                    entityType: "Enrollment",
                    entityId: newEnrollment.id,
                    changes: {
                        status: { from: null, to: "active" },
                        offeringId: { from: null, to: targetOfferingId },
                    },
                    metadata: {
                        studentId: currEnrollment.studentId,
                        studentName: `${currEnrollment.student.firstName} ${currEnrollment.student.lastName}`,
                        offeringId: targetOfferingId,
                        transferredFrom: enrollmentId,
                        skipsCreated: skippedSessionIds.length,
                    },
                },
            });
            return {
                success: true,
                oldEnrollmentId: enrollmentId,
                newEnrollmentId: newEnrollment.id,
            };
        });
    }
    async enrollWithSkips(input, user) {
        const { studentId, offeringId, skippedDates, classRatio } = input;
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student)
            throw new common_1.NotFoundException("Student not found");
        const offering = await this.prisma.classOffering.findUnique({
            where: { id: offeringId },
            include: { term: true },
        });
        if (!offering)
            throw new common_1.NotFoundException("Offering not found");
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                offeringId_studentId: {
                    offeringId,
                    studentId,
                },
            },
        });
        if (existingEnrollment)
            throw new common_1.BadRequestException("Student already enrolled");
        return await this.prisma.$transaction(async (tx) => {
            // Create enrollment
            const enrollment = await tx.enrollment.create({
                data: {
                    studentId,
                    offeringId,
                    status: "active",
                    enrollDate: new Date(),
                    createdBy: staffUser.id,
                    classRatio,
                },
            });
            // Create skips if any
            let sessionIds = [];
            if (skippedDates.length > 0) {
                const sessions = await tx.classSession.findMany({
                    where: {
                        offeringId,
                        date: {
                            in: skippedDates.map((d) => new Date(`${d}T00:00:00.000Z`)),
                        },
                    },
                    select: { id: true, date: true },
                });
                if (sessions.length !== skippedDates.length) {
                    throw new common_1.BadRequestException("Some skipped dates don't have a class session associated with it");
                }
                sessionIds = sessions.map((s) => s.id);
                await tx.enrollmentSkip.createMany({
                    data: sessions.map((session) => ({
                        enrollmentId: enrollment.id,
                        classSessionId: session.id,
                    })),
                });
            }
            // Create audit log for enrollment
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Enroll Student",
                    entityType: "Enrollment",
                    entityId: enrollment.id,
                    changes: {
                        status: { from: null, to: "active" },
                    },
                    metadata: {
                        studentId: studentId,
                        studentName: `${student.firstName} ${student.lastName}`,
                        offeringId: offeringId,
                        skippedDates: skippedDates,
                        skippedSessionIds: sessionIds,
                        skipsCreated: skippedDates.length,
                    },
                },
            });
            return {
                success: true,
                enrollmentId: enrollment.id,
                skipsCreated: skippedDates.length,
            };
        });
    }
    async updateReportCardStatus(enrollmentId, status, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const curr = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });
        if (!curr)
            throw new common_1.NotFoundException("Enrollment not found");
        const updated = await this.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { reportCardStatus: status },
        });
        await this.prisma.auditLog.create({
            data: {
                staffId: staffUser.id,
                action: "Update Report Card Status",
                entityType: "Enrollment",
                entityId: enrollmentId,
                changes: {
                    status: { from: curr.reportCardStatus, to: status },
                },
            },
        });
        return { success: true, status };
    }
    async deleteEnrollment(id, user) {
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                student: true,
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException("Enrollment not found");
        }
        await this.prisma.$transaction(async (tx) => {
            // Delete enrollment (cascade should handle skips/attendance if configured,
            // but let's assume we might need to be careful. For now, standard delete)
            await tx.enrollment.delete({
                where: { id },
            });
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Delete Enrollment",
                    entityType: "Enrollment",
                    entityId: id,
                    changes: {
                        status: { from: enrollment.status, to: null },
                    },
                    metadata: {
                        studentId: enrollment.studentId,
                        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                        offeringId: enrollment.offeringId,
                    },
                },
            });
        });
        return { success: true };
    }
    async findUninvoiced() {
        return this.prisma.enrollment.findMany({
            where: {
                status: "active",
                invoiceLineItem: null,
            },
            include: {
                student: {
                    include: {
                        guardian: true,
                    },
                },
                offering: {
                    include: {
                        term: true,
                    },
                },
            },
            orderBy: {
                enrollDate: "desc",
            },
        });
    }
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnrollmentsService);
