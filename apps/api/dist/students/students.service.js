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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async autoShortCode(firstName, lastName) {
        const base = (firstName.substring(0, 3) + lastName.substring(0, 2)).toUpperCase();
        let code = base || "S";
        let n = 1;
        while (await this.prisma.student.findUnique({ where: { shortCode: code } })) {
            code = `${base}${++n}`;
        }
        return code;
    }
    async searchOrList(params) {
        const { query, page = 1, pageSize = 20, guardianId, enrollmentStatus, level, } = params;
        const where = {
            ...(guardianId ? { guardianId } : {}),
            ...(level ? { level: level === "none" ? null : level } : {}),
            ...(enrollmentStatus === "active"
                ? {
                    enrollments: { some: { status: "active" } },
                }
                : enrollmentStatus === "inactive"
                    ? {
                        enrollments: { none: { status: "active" } },
                    }
                    : {}),
            ...(query
                ? {
                    OR: [
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        { shortCode: { contains: query, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [total, items] = await this.prisma.$transaction([
            this.prisma.student.count({ where }),
            this.prisma.student.findMany({
                where,
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    shortCode: true,
                    firstName: true,
                    lastName: true,
                    birthdate: true,
                    level: true,
                    guardianId: true,
                    guardian: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        return { total, page, pageSize, items };
    }
    async getById(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            select: {
                id: true,
                shortCode: true,
                firstName: true,
                lastName: true,
                birthdate: true,
                level: true,
                guardianId: true,
                guardian: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                enrollments: {
                    select: {
                        id: true,
                        offeringId: true,
                        status: true,
                        enrollDate: true,
                        classRatio: true,
                        offering: {
                            select: {
                                id: true,
                                title: true,
                                weekday: true,
                                startTime: true,
                                endTime: true,
                                capacity: true,
                                termId: true,
                                term: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
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
                        attendance: {
                            where: {
                                status: { in: ["present", "absent", "excused"] },
                            },
                            select: {
                                id: true,
                                status: true,
                                classSessionId: true,
                                classSession: {
                                    select: {
                                        id: true,
                                        date: true,
                                    },
                                },
                            },
                        },
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
                    },
                    orderBy: { enrollDate: "desc" },
                },
                makeUps: {
                    select: {
                        id: true,
                        status: true,
                        notes: true,
                        createdAt: true,
                        classSession: {
                            select: {
                                date: true,
                                offering: {
                                    select: {
                                        title: true,
                                        weekday: true,
                                        startTime: true,
                                        endTime: true,
                                        termId: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { classSession: { date: "desc" } },
                },
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!student)
            throw new common_1.NotFoundException("Student not found");
        return student;
    }
    async create(dto, user) {
        const { guardianId, shortCode, firstName, lastName, level, birthdate } = dto;
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const generatedShortCode = shortCode ?? (await this.autoShortCode(firstName, lastName));
        return await this.prisma.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: {
                    guardianId,
                    shortCode: generatedShortCode,
                    firstName,
                    lastName,
                    level: level ?? null,
                    birthdate: birthdate ?? null,
                    createdBy: staffUser.id,
                },
                select: {
                    id: true,
                    shortCode: true,
                    firstName: true,
                    lastName: true,
                    birthdate: true,
                    level: true,
                    guardianId: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: true,
                },
            });
            // Create audit log for student creation
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Create Student",
                    entityType: "Student",
                    entityId: student.id,
                    changes: {
                        firstName: { from: null, to: firstName },
                        lastName: { from: null, to: lastName },
                        shortCode: { from: null, to: generatedShortCode },
                        level: { from: null, to: level ?? null },
                        birthdate: { from: null, to: birthdate ?? null },
                        guardianId: { from: null, to: guardianId },
                    },
                    metadata: {
                        studentName: `${firstName} ${lastName}`,
                        shortCode: generatedShortCode,
                    },
                },
            });
            return student;
        });
    }
    async update(id, dto, user) {
        await this.ensureExists(id);
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        // Get existing student data to track changes
        const existing = await this.prisma.student.findUnique({
            where: { id },
            select: {
                firstName: true,
                lastName: true,
                shortCode: true,
                level: true,
                birthdate: true,
                guardianId: true,
            },
        });
        if (existing) {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.student.update({
                    where: { id },
                    data: {
                        ...(dto.guardianId !== undefined
                            ? { guardianId: dto.guardianId }
                            : {}),
                        ...(dto.shortCode !== undefined
                            ? { shortCode: dto.shortCode }
                            : {}),
                        ...(dto.firstName !== undefined
                            ? { firstName: dto.firstName }
                            : {}),
                        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
                        ...(dto.level !== undefined ? { level: dto.level } : {}),
                        ...(dto.birthdate !== undefined
                            ? { birthdate: dto.birthdate }
                            : {}),
                        updatedBy: staffUser.id,
                    },
                    select: {
                        id: true,
                        shortCode: true,
                        firstName: true,
                        lastName: true,
                        level: true,
                        birthdate: true,
                        guardianId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                // Build changes object only for fields that actually changed
                const changes = {};
                if (dto.firstName !== undefined &&
                    dto.firstName !== existing.firstName) {
                    changes.firstName = { from: existing.firstName, to: dto.firstName };
                }
                if (dto.lastName !== undefined && dto.lastName !== existing.lastName) {
                    changes.lastName = { from: existing.lastName, to: dto.lastName };
                }
                if (dto.shortCode !== undefined &&
                    dto.shortCode !== existing.shortCode) {
                    changes.shortCode = { from: existing.shortCode, to: dto.shortCode };
                }
                if (dto.level !== undefined && dto.level !== existing.level) {
                    changes.level = { from: existing.level, to: dto.level };
                }
                if (dto.birthdate !== undefined &&
                    dto.birthdate?.toString() !== existing.birthdate?.toString()) {
                    changes.birthdate = { from: existing.birthdate, to: dto.birthdate };
                }
                if (dto.guardianId !== undefined &&
                    dto.guardianId !== existing.guardianId) {
                    changes.guardianId = {
                        from: existing.guardianId,
                        to: dto.guardianId,
                    };
                }
                // Only create audit log if something actually changed
                if (Object.keys(changes).length > 0) {
                    await tx.auditLog.create({
                        data: {
                            staffId: staffUser.id,
                            action: "Update Student",
                            entityType: "Student",
                            entityId: id,
                            changes,
                            metadata: {
                                studentName: `${updated.firstName} ${updated.lastName}`,
                                shortCode: updated.shortCode,
                            },
                        },
                    });
                }
                return updated;
            });
        }
    }
    async delete(id, user) {
        await this.ensureExists(id);
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const c = await this.prisma.enrollment.count({ where: { studentId: id } });
        if (c > 0)
            throw new common_1.BadRequestException("Student is currently enrolled!");
        // Get student data before deletion
        const student = await this.prisma.student.findUnique({
            where: { id },
            select: {
                firstName: true,
                lastName: true,
                shortCode: true,
                level: true,
                birthdate: true,
                guardianId: true,
            },
        });
        if (student) {
            return await this.prisma.$transaction(async (tx) => {
                // Create audit log before deletion
                await tx.auditLog.create({
                    data: {
                        staffId: staffUser.id,
                        action: "Delete Student",
                        entityType: "Student",
                        entityId: id,
                        changes: {
                            firstName: { from: student.firstName, to: null },
                            lastName: { from: student.lastName, to: null },
                            shortCode: { from: student.shortCode, to: null },
                            level: { from: student.level, to: null },
                            birthdate: { from: student.birthdate, to: null },
                            guardianId: { from: student.guardianId, to: null },
                        },
                        metadata: {
                            studentName: `${student.firstName} ${student.lastName}`,
                            shortCode: student.shortCode,
                            deletedAt: new Date().toISOString(),
                        },
                    },
                });
                await tx.student.delete({ where: { id } });
                return { ok: true };
            });
        }
    }
    async ensureExists(id) {
        const ok = await this.prisma.student.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!ok)
            throw new common_1.NotFoundException("Student not found");
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
