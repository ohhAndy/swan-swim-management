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
exports.StaffUsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let StaffUsersService = class StaffUsersService {
    constructor(prisma, auditLogsService) {
        this.prisma = prisma;
        this.auditLogsService = auditLogsService;
    }
    async findAll() {
        return this.prisma.staffUser.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                active: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });
    }
    async findByAuthId(authId) {
        return this.prisma.staffUser.findUnique({
            where: { authId },
            select: {
                id: true,
                authId: true,
                email: true,
                fullName: true,
                role: true,
                active: true,
            },
        });
    }
    async findByEmail(email) {
        return this.prisma.staffUser.findUnique({
            where: { email },
        });
    }
    async createStaffUser(data, adminUser) {
        const newUser = await this.prisma.staffUser.create({
            data: {
                authId: data.authId,
                email: data.email,
                fullName: data.fullName,
                role: data.role || "viewer",
                active: true,
                accessSchedule: data.accessSchedule,
            },
        });
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: adminUser.authId },
        });
        if (staffUser) {
            await this.auditLogsService.create({
                staffId: staffUser.id,
                action: "create",
                entityType: "staff_user",
                entityId: newUser.id,
                changes: {
                    email: newUser.email,
                    role: newUser.role,
                    fullName: newUser.fullName,
                },
            });
        }
        return newUser;
    }
    async updateStaffUser(id, data, adminUser) {
        const updatedUser = await this.prisma.staffUser.update({
            where: { id },
            data: {
                ...data,
                accessSchedule: data.accessSchedule,
            },
        });
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: adminUser.authId },
        });
        if (staffUser) {
            await this.auditLogsService.create({
                staffId: staffUser.id,
                action: "update",
                entityType: "staff_user",
                entityId: id,
                changes: data,
            });
        }
        return updatedUser;
    }
};
exports.StaffUsersService = StaffUsersService;
exports.StaffUsersService = StaffUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_logs_service_1.AuditLogsService])
], StaffUsersService);
