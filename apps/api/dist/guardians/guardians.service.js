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
exports.GuardiansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GuardiansService = class GuardiansService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchOrList(params) {
        const { query, page = 1, pageSize = 20 } = params;
        const where = query
            ? {
                OR: [
                    { fullName: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { shortCode: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query, mode: "insensitive" } },
                ],
            }
            : {};
        const [total, items] = await this.prisma.$transaction([
            this.prisma.guardian.count({ where }),
            this.prisma.guardian.findMany({
                where,
                orderBy: [{ fullName: "asc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    shortCode: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    address: true,
                    notes: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        return { total, page, pageSize, items };
    }
    async getById(id) {
        const guardian = await this.prisma.guardian.findUnique({
            where: { id },
            include: {
                students: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        shortCode: true,
                    },
                    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
                },
            },
        });
        if (!guardian)
            throw new common_1.NotFoundException("Guardian not found");
        return guardian;
    }
    async create(dto, user) {
        const { fullName, shortCode, email, phone, address, notes } = dto;
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        const generatedShortCode = shortCode ?? (await this.autoShortCode(fullName));
        return await this.prisma.$transaction(async (tx) => {
            const guardian = await tx.guardian.create({
                data: {
                    fullName,
                    shortCode: generatedShortCode,
                    email,
                    phone,
                    address: address ?? client_1.Prisma.JsonNull,
                    notes: notes ?? null,
                    createdBy: staffUser.id,
                },
                select: {
                    id: true,
                    shortCode: true,
                    fullName: true,
                    phone: true,
                    email: true,
                    address: true,
                    notes: true,
                    createdAt: true,
                    createdBy: true,
                    updatedAt: true,
                    updatedBy: true,
                },
            });
            // Create audit log for guardian creation
            await tx.auditLog.create({
                data: {
                    staffId: staffUser.id,
                    action: "Create Guardian",
                    entityType: "Guardian",
                    entityId: guardian.id,
                    changes: {
                        fullName: { from: null, to: fullName },
                        shortCode: { from: null, to: generatedShortCode },
                        email: { from: null, to: email },
                        phone: { from: null, to: phone },
                        address: { from: null, to: address ?? null },
                        notes: { from: null, to: notes ?? null },
                    },
                    metadata: {
                        guardianName: fullName,
                        shortCode: generatedShortCode,
                        email: email,
                    },
                },
            });
            return guardian;
        });
    }
    async update(id, dto, user) {
        await this.ensureExists(id);
        const staffUser = await this.prisma.staffUser.findUnique({
            where: { authId: user.authId },
        });
        if (!staffUser)
            return;
        // Get existing guardian data to track changes
        const existing = await this.prisma.guardian.findUnique({
            where: { id },
            select: {
                fullName: true,
                shortCode: true,
                email: true,
                phone: true,
                address: true,
                notes: true,
            },
        });
        if (existing) {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.guardian.update({
                    where: { id },
                    data: {
                        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
                        ...(dto.shortCode !== undefined
                            ? { shortCode: dto.shortCode }
                            : {}),
                        ...(dto.email !== undefined ? { email: dto.email } : {}),
                        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
                        ...(dto.address !== undefined ? { address: dto.address } : {}),
                        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
                        updatedBy: staffUser.id,
                    },
                    select: {
                        id: true,
                        shortCode: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        address: true,
                        notes: true,
                        createdAt: true,
                        createdBy: true,
                        updatedAt: true,
                        updatedBy: true,
                    },
                });
                // Build changes object only for fields that actually changed
                const changes = {};
                if (dto.fullName !== undefined && dto.fullName !== existing.fullName) {
                    changes.fullName = { from: existing.fullName, to: dto.fullName };
                }
                if (dto.shortCode !== undefined &&
                    dto.shortCode !== existing.shortCode) {
                    changes.shortCode = { from: existing.shortCode, to: dto.shortCode };
                }
                if (dto.email !== undefined && dto.email !== existing.email) {
                    changes.email = { from: existing.email, to: dto.email };
                }
                if (dto.phone !== undefined && dto.phone !== existing.phone) {
                    changes.phone = { from: existing.phone, to: dto.phone };
                }
                if (dto.address !== undefined &&
                    JSON.stringify(dto.address) !== JSON.stringify(existing.address)) {
                    changes.address = { from: existing.address, to: dto.address };
                }
                if (dto.notes !== undefined && dto.notes !== existing.notes) {
                    changes.notes = { from: existing.notes, to: dto.notes };
                }
                // Only create audit log if something actually changed
                if (Object.keys(changes).length > 0) {
                    await tx.auditLog.create({
                        data: {
                            staffId: staffUser.id,
                            action: "Update Guardian",
                            entityType: "Guardian",
                            entityId: id,
                            changes,
                            metadata: {
                                guardianName: updated.fullName,
                                shortCode: updated.shortCode,
                                email: updated.email,
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
        const c = await this.prisma.student.count({ where: { guardianId: id } });
        if (c > 0)
            throw new common_1.BadRequestException("Guardian has associated students!");
        // Get guardian data before deletion
        const guardian = await this.prisma.guardian.findUnique({
            where: { id },
            select: {
                fullName: true,
                shortCode: true,
                email: true,
                phone: true,
                address: true,
                notes: true,
            },
        });
        if (guardian) {
            return await this.prisma.$transaction(async (tx) => {
                // Create audit log before deletion
                await tx.auditLog.create({
                    data: {
                        staffId: staffUser.id,
                        action: "Delete Guardian",
                        entityType: "Guardian",
                        entityId: id,
                        changes: {
                            fullName: { from: guardian.fullName, to: null },
                            shortCode: { from: guardian.shortCode, to: null },
                            email: { from: guardian.email, to: null },
                            phone: { from: guardian.phone, to: null },
                            address: { from: guardian.address, to: null },
                            notes: { from: guardian.notes, to: null },
                        },
                        metadata: {
                            guardianName: guardian.fullName,
                            shortCode: guardian.shortCode,
                            email: guardian.email,
                            deletedAt: new Date().toISOString(),
                        },
                    },
                });
                await tx.guardian.delete({ where: { id } });
                return { ok: true };
            });
        }
    }
    async ensureExists(id) {
        const ok = await this.prisma.guardian.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!ok)
            throw new common_1.NotFoundException("Guardian not found");
    }
    async autoShortCode(fullName) {
        const base = fullName
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("");
        let code = base || "G";
        let n = 1;
        while (await this.prisma.guardian.findUnique({ where: { shortCode: code } })) {
            code = `${base}${++n}`;
        }
        return code;
    }
};
exports.GuardiansService = GuardiansService;
exports.GuardiansService = GuardiansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GuardiansService);
