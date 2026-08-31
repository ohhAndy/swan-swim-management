import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateGuardianDto,
  SearchGuardianDto,
  UpdateGuardianDto,
} from "./dto/schemas.dto";
import { Prisma } from "@prisma/client";
import { RequestStaffUser } from "../auth/auth.types";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class GuardiansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async searchOrList(params: SearchGuardianDto) {
    const { query, page = 1, pageSize = 20, waiverStatus } = params;

    const trimmedQuery = query?.trim();
    const digitsOnly = trimmedQuery ? trimmedQuery.replace(/\D/g, "") : "";

    const phoneQueries: Prisma.GuardianWhereInput[] = [];
    if (trimmedQuery) {
      phoneQueries.push({
        phone: { contains: trimmedQuery, mode: "insensitive" },
      });
    }
    if (digitsOnly && digitsOnly.length >= 3 && digitsOnly !== trimmedQuery) {
      phoneQueries.push({
        phone: { contains: digitsOnly, mode: "insensitive" },
      });

      if (digitsOnly.length === 10) {
        phoneQueries.push(
          {
            phone: {
              contains: `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: `(${digitsOnly.slice(0, 3)})${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`,
              mode: "insensitive",
            },
          },
        );
      } else if (digitsOnly.length === 7) {
        phoneQueries.push(
          {
            phone: {
              contains: `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`,
              mode: "insensitive",
            },
          },
        );
      }
    }

    const where: Prisma.GuardianWhereInput = {
      ...(trimmedQuery
        ? {
            OR: [
              { fullName: { contains: trimmedQuery, mode: "insensitive" } },
              { email: { contains: trimmedQuery, mode: "insensitive" } },
              { shortCode: { contains: trimmedQuery, mode: "insensitive" } },
              ...phoneQueries,
              {
                students: {
                  some: {
                    OR: [
                      {
                        firstName: {
                          contains: trimmedQuery,
                          mode: "insensitive",
                        },
                      },
                      {
                        lastName: {
                          contains: trimmedQuery,
                          mode: "insensitive",
                        },
                      },
                      ...(trimmedQuery.indexOf(" ") > 0
                        ? [
                            {
                              AND: [
                                {
                                  firstName: {
                                    contains: trimmedQuery.split(/\s+/)[0],
                                    mode: "insensitive" as Prisma.QueryMode,
                                  },
                                },
                                {
                                  lastName: {
                                    contains: trimmedQuery
                                      .split(/\s+/)
                                      .slice(1)
                                      .join(" "),
                                    mode: "insensitive" as Prisma.QueryMode,
                                  },
                                },
                              ],
                            },
                          ]
                        : []),
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(waiverStatus === "signed" ? { waiverSigned: true } : {}),
      ...(waiverStatus === "pending" ? { waiverSigned: false } : {}),
    };

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
          notes: true,
          createdAt: true,
          updatedAt: true,
          waiverSigned: true,
          students: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getById(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shortCode: true,
            birthdate: true, // Added
            level: true, // Added
            enrollments: {
              // Added
              where: { status: { in: ["active", "inactive", "transferred"] } }, // Filter maybe? Keeping all for history
              orderBy: { enrollDate: "desc" },
              select: {
                id: true,
                status: true,
                enrollDate: true,
                classRatio: true,
                offering: {
                  select: {
                    id: true,
                    title: true,
                    termId: true, // Added for transfer dialog
                    weekday: true,
                    startTime: true,
                    endTime: true,
                    term: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    instructors: {
                      where: { removedAt: null },
                      select: {
                        staffUser: {
                          select: {
                            fullName: true,
                          },
                        },
                        instructor: {
                          select: {
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
                    sessions: {
                      select: {
                        id: true,
                        date: true,
                      },
                      orderBy: { date: "asc" },
                    },
                  },
                },
                invoiceLineItem: {
                  select: {
                    invoice: {
                      select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        payments: {
                          select: {
                            amount: true,
                          },
                        },
                      },
                    },
                  },
                },
                attendance: {
                  select: {
                    id: true,
                    status: true,
                    markedAt: true,
                    classSession: {
                      select: {
                        date: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    });
    if (!guardian) throw new NotFoundException("Guardian not found");
    return guardian;
  }

  async create(dto: CreateGuardianDto, staffUser: RequestStaffUser) {
    const { fullName, shortCode, email, phone, notes, waiverSigned } = dto;

    const generatedShortCode =
      shortCode ?? (await this.autoShortCode(fullName));

    return await this.prisma.$transaction(async (tx) => {
      const guardian = await tx.guardian.create({
        data: {
          fullName,
          shortCode: generatedShortCode,
          email,
          phone,

          notes: notes ?? null,
          waiverSigned: waiverSigned ?? false,
          createdBy: staffUser.id,
        },
        select: {
          id: true,
          shortCode: true,
          fullName: true,
          phone: true,
          email: true,

          notes: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
        },
      });

      // Create audit log for guardian creation
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "Create Guardian",
          entityType: "Guardian",
          entityId: guardian.id,
          changes: {
            fullName: { from: null, to: fullName },
            shortCode: { from: null, to: generatedShortCode },
            email: { from: null, to: email },
            phone: { from: null, to: phone },
            notes: { from: null, to: notes ?? null },
            waiverSigned: { from: null, to: waiverSigned ?? false },
          },
          metadata: {
            guardianName: fullName,
            shortCode: generatedShortCode,
            email: email,
          },
        },
        tx,
      );

      return guardian;
    });
  }

  async update(id: string, dto: UpdateGuardianDto, staffUser: RequestStaffUser) {
    await this.ensureExists(id);

    // Get existing guardian data to track changes
    const existing = await this.prisma.guardian.findUnique({
      where: { id },
      select: {
        fullName: true,
        shortCode: true,
        email: true,
        phone: true,

        notes: true,
        waiverSigned: true,
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

            ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            ...(dto.waiverSigned !== undefined
              ? { waiverSigned: dto.waiverSigned }
              : {}),
            updatedBy: staffUser.id,
          },
          select: {
            id: true,
            shortCode: true,
            fullName: true,
            email: true,
            phone: true,

            notes: true,
            waiverSigned: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
          },
        });

        // Build changes object only for fields that actually changed
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        if (dto.fullName !== undefined && dto.fullName !== existing.fullName) {
          changes.fullName = { from: existing.fullName, to: dto.fullName };
        }
        if (
          dto.shortCode !== undefined &&
          dto.shortCode !== existing.shortCode
        ) {
          changes.shortCode = { from: existing.shortCode, to: dto.shortCode };
        }
        if (dto.email !== undefined && dto.email !== existing.email) {
          changes.email = { from: existing.email, to: dto.email };
        }
        if (dto.phone !== undefined && dto.phone !== existing.phone) {
          changes.phone = { from: existing.phone, to: dto.phone };
        }

        if (dto.notes !== undefined && dto.notes !== existing.notes) {
          changes.notes = { from: existing.notes, to: dto.notes };
        }
        if (
          dto.waiverSigned !== undefined &&
          dto.waiverSigned !== existing.waiverSigned
        ) {
          changes.waiverSigned = {
            from: existing.waiverSigned,
            to: dto.waiverSigned,
          };
        }

        // Only create audit log if something actually changed
        if (Object.keys(changes).length > 0) {
          await this.auditLogsService.create(
            {
              staffId: staffUser.id,
              action: "Update Guardian",
              entityType: "Guardian",
              entityId: id,
              changes: changes as Prisma.InputJsonValue,
              metadata: {
                guardianName: updated.fullName,
                shortCode: updated.shortCode,
                email: updated.email,
              },
            },
            tx,
          );
        }

        return updated;
      });
    }
  }

  async delete(id: string, staffUser: RequestStaffUser) {
    await this.ensureExists(id);

    const c = await this.prisma.student.count({ where: { guardianId: id } });
    if (c > 0)
      throw new BadRequestException("Guardian has associated students!");

    // Get guardian data before deletion
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      select: {
        fullName: true,
        shortCode: true,
        email: true,
        phone: true,

        notes: true,
        waiverSigned: true,
      },
    });

    if (guardian) {
      return await this.prisma.$transaction(async (tx) => {
        // Create audit log before deletion
        await this.auditLogsService.create(
          {
            staffId: staffUser.id,
            action: "Delete Guardian",
            entityType: "Guardian",
            entityId: id,
            changes: {
              fullName: { from: guardian.fullName, to: null },
              shortCode: { from: guardian.shortCode, to: null },
              email: { from: guardian.email, to: null },
              phone: { from: guardian.phone, to: null },

              notes: { from: guardian.notes, to: null },
              waiverSigned: { from: guardian.waiverSigned, to: null },
            },
            metadata: {
              guardianName: guardian.fullName,
              shortCode: guardian.shortCode,
              email: guardian.email,
              deletedAt: new Date().toISOString(),
            },
          },
          tx,
        );

        await tx.guardian.delete({ where: { id } });

        return { ok: true };
      });
    }
  }

  private async ensureExists(id: string) {
    const ok = await this.prisma.guardian.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ok) throw new NotFoundException("Guardian not found");
  }

  private async autoShortCode(fullName: string) {
    const base = fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    let code = base || "G";
    let n = 1;
    while (
      await this.prisma.guardian.findUnique({ where: { shortCode: code } })
    ) {
      code = `${base}${++n}`;
    }
    return code;
  }
}
