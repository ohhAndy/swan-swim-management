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
exports.ClassInstructorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClassInstructorsService = class ClassInstructorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assignInstructor(classOfferingId, staffUserId, assignedBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: assignedBy.authId },
        });
        if (!user)
            return;
        // Verify class offering exists
        const classOffering = await this.prisma.classOffering.findUnique({
            where: { id: classOfferingId },
        });
        if (!classOffering) {
            throw new common_1.NotFoundException("Class offering not found");
        }
        // Verify staff user exists
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { id: staffUserId },
        });
        if (!staffUser) {
            throw new common_1.NotFoundException("Staff user not found");
        }
        // Check if already assigned (active assignment)
        const existing = await this.prisma.classInstructor.findFirst({
            where: {
                classOfferingId,
                staffUserId,
                removedAt: null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException("This instructor is already assigned to this class");
        }
        // Create assignment
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.classInstructor.create({
                data: {
                    classOfferingId,
                    staffUserId,
                    assignedBy: user.id,
                },
                include: {
                    staffUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    assignedByUser: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: 'Assign Instructor',
                    entityType: 'ClassInstructor',
                    entityId: assignment.id,
                    metadata: {
                        classOfferingTitle: classOffering.title,
                        instructorName: staffUser.fullName,
                        instructorId: staffUser.id,
                    },
                },
            });
            return assignment;
        });
    }
    async removeInstructor(assignmentId, removedBy) {
        const user = await this.prisma.staffUser.findUnique({
            where: { authId: removedBy.authId },
        });
        if (!user)
            return;
        const assignment = await this.prisma.classInstructor.findUnique({
            where: { id: assignmentId },
            include: {
                staffUser: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                classOffering: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if (!assignment) {
            throw new common_1.NotFoundException("Instructor assignment not found");
        }
        if (assignment.removedAt) {
            throw new common_1.ConflictException("This instructor assignment is already removed");
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.classInstructor.update({
                where: { id: assignmentId },
                data: {
                    removedAt: new Date(),
                    removedBy: user.id,
                },
                include: {
                    staffUser: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    removedByUser: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    staffId: user.id,
                    action: 'Remove Instructor',
                    entityType: 'ClassInstructor',
                    entityId: assignmentId,
                    metadata: {
                        classOfferingTitle: assignment.classOffering.title,
                        instructorName: assignment.staffUser.fullName,
                        instructorId: assignment.staffUser.id,
                    },
                },
            });
            return updated;
        });
    }
    async getActiveInstructorsForClass(classOfferingId) {
        return this.prisma.classInstructor.findMany({
            where: {
                classOfferingId,
                removedAt: null,
            },
            include: {
                staffUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                assignedAt: "asc",
            },
        });
    }
    async getInstructorHistory(classOfferingId) {
        return this.prisma.classInstructor.findMany({
            where: {
                classOfferingId,
            },
            include: {
                staffUser: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                assignedByUser: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                removedByUser: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                assignedAt: "desc",
            },
        });
    }
    async getClassesForInstructor(staffUserId, activeOnly = true) {
        return this.prisma.classInstructor.findMany({
            where: {
                staffUserId,
                ...(activeOnly ? { removedAt: null } : {}),
            },
            include: {
                classOffering: {
                    include: {
                        term: true,
                        _count: {
                            select: {
                                enrollments: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                assignedAt: "desc",
            },
        });
    }
};
exports.ClassInstructorsService = ClassInstructorsService;
exports.ClassInstructorsService = ClassInstructorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClassInstructorsService);
