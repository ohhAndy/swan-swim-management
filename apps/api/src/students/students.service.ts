import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateStudentDto,
  SearchStudentsDto,
  UpdateStudentDto,
} from "./dto/schemas.dto";
import { Prisma } from "@prisma/client";
import { RequestStaffUser, StaffUserWithLocations } from "../auth/auth.types";

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async autoShortCode(firstName: string, lastName: string) {
    const base = (
      firstName.substring(0, 3) + lastName.substring(0, 2)
    ).toUpperCase();
    let code = base || "S";
    let n = 1;
    while (
      await this.prisma.student.findUnique({ where: { shortCode: code } })
    ) {
      code = `${base}${++n}`;
    }
    return code;
  }

  async searchOrList(params: SearchStudentsDto) {
    await this.deactivateExpiredEnrollments();
    const {
      query,
      page = 1,
      pageSize = 20,
      guardianId,
      enrollmentStatus,
      level,
    } = params;

    const where: Prisma.StudentWhereInput = {
      ...(guardianId ? { guardianId } : {}),
      ...(level ? { level: level === "none" ? null : level } : {}),
      ...(enrollmentStatus === "active"
        ? {
            enrollments: {
              some: {
                status: "active",
                offering: {
                  term: {
                    endDate: {
                      gte: new Date(),
                    },
                  },
                },
              },
            },
          }
        : enrollmentStatus === "inactive"
          ? {
              enrollments: {
                none: {
                  status: "active",
                  offering: {
                    term: {
                      endDate: {
                        gte: new Date(),
                      },
                    },
                  },
                },
              },
            }
          : {}),
      ...(query
        ? {
            OR: [
              { firstName: { contains: query.trim(), mode: "insensitive" } },
              { lastName: { contains: query.trim(), mode: "insensitive" } },
              { shortCode: { contains: query.trim(), mode: "insensitive" } },
              ...(query.trim().indexOf(" ") > 0
                ? [
                    {
                      AND: [
                        {
                          firstName: {
                            contains: query.trim().split(/\s+/)[0],
                            mode: "insensitive",
                          },
                        },
                        {
                          lastName: {
                            contains: query
                              .trim()
                              .split(/\s+/)
                              .slice(1)
                              .join(" "),
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  ]
                : []),
            ] as Prisma.StudentWhereInput[],
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
          levelId: true,
          levelModel: {
            select: {
              id: true,
              name: true,
              category: true,
              color: true,
              order: true,
            },
          },
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

  async getById(id: string, staffUser?: StaffUserWithLocations) {
    await this.deactivateExpiredEnrollments();
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        shortCode: true,
        firstName: true,
        lastName: true,
        birthdate: true,
        level: true,
        levelId: true,
        levelModel: {
          select: {
            id: true,
            name: true,
            category: true,
            color: true,
            order: true,
          },
        },
        notes: true,
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
                    endDate: true,
                    location: {
                      select: {
                        name: true,
                      },
                    },
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
                    instructor: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                  orderBy: { assignedAt: "asc" },
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

            enrollmentSkips: {
              select: {
                id: true,
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
            transferredFrom: {
              select: {
                offering: {
                  select: {
                    title: true,
                    term: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            transferredTo: {
              select: {
                offering: {
                  select: {
                    title: true,
                    term: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            reportCards: {
              select: {
                id: true,
                status: true,
                createdBy: true,
                updatedAt: true,
                createdByUser: {
                  select: {
                    fullName: true,
                  },
                },
                level: {
                  select: {
                    name: true,
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
                    id: true,
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
    if (!student) throw new NotFoundException("Student not found");

    const isEnrollmentActive = (e: NonNullable<typeof student>["enrollments"][number]) => {
      if (e.status !== "active") return false;
      if (!e.offering?.term?.endDate) return true;
      const now = new Date();
      const end = new Date(e.offering.term.endDate);
      end.setHours(23, 59, 59, 999);
      return now <= end;
    };

    if (staffUser?.role === "supervisor") {
      let pastCount = 0;
      student.enrollments = student.enrollments.filter((e) => {
        if (isEnrollmentActive(e)) {
          return true;
        }
        const hasReportCardCreatedByMe = e.reportCards.some(
          (rc) => rc.createdBy === staffUser.id,
        );
        if (hasReportCardCreatedByMe) {
          return true;
        }
        if (e.status !== "transferred" && !e.transferredTo && pastCount < 1) {
          pastCount++;
          return true;
        }
        return false;
      });
    }

    return student;
  }

  async create(dto: CreateStudentDto, staffUser: RequestStaffUser) {
    const { guardianId, shortCode, firstName, lastName, level, birthdate } =
      dto;

    const generatedShortCode =
      shortCode ?? (await this.autoShortCode(firstName, lastName));

    return await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          guardianId,
          shortCode: generatedShortCode,
          firstName,
          lastName,
          level: level ?? null,
          levelId: dto.levelId ?? null,
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
          levelId: true,
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

  async update(id: string, dto: UpdateStudentDto, staffUser: RequestStaffUser) {
    await this.ensureExists(id);

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
        notes: true,
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
            ...(dto.levelId !== undefined
              ? { levelId: dto.levelId ?? null }
              : {}),
            ...(dto.birthdate !== undefined
              ? { birthdate: dto.birthdate }
              : {}),
            ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            updatedBy: staffUser.id,
          },
          select: {
            id: true,
            shortCode: true,
            firstName: true,
            lastName: true,
            level: true,
            levelId: true,
            notes: true,
            birthdate: true,
            guardianId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Build changes object only for fields that actually changed
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        if (
          dto.firstName !== undefined &&
          dto.firstName !== existing.firstName
        ) {
          changes.firstName = { from: existing.firstName, to: dto.firstName };
        }
        if (dto.lastName !== undefined && dto.lastName !== existing.lastName) {
          changes.lastName = { from: existing.lastName, to: dto.lastName };
        }
        if (
          dto.shortCode !== undefined &&
          dto.shortCode !== existing.shortCode
        ) {
          changes.shortCode = { from: existing.shortCode, to: dto.shortCode };
        }
        if (dto.level !== undefined && dto.level !== existing.level) {
          changes.level = { from: existing.level, to: dto.level };
        }
        if (
          dto.birthdate !== undefined &&
          dto.birthdate?.toString() !== existing.birthdate?.toString()
        ) {
          changes.birthdate = { from: existing.birthdate, to: dto.birthdate };
        }
        if (
          dto.guardianId !== undefined &&
          dto.guardianId !== existing.guardianId
        ) {
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
              changes: changes as Prisma.InputJsonValue,
              metadata: {
                studentName: `${updated.firstName} ${updated.lastName}`,
                shortCode: updated.shortCode,
              },
            },
          });
        }

        // Track notes change in audit log changes object
        if (dto.notes !== undefined && dto.notes !== existing.notes) {
          changes.notes = { from: existing.notes, to: dto.notes };
        }

        return updated;
      });
    }
  }

  async updateNotes(studentId: string, notes: string, staffUser: RequestStaffUser) {

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        shortCode: true,
        notes: true,
      },
    });
    if (!student) throw new NotFoundException("Student not found");

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { notes },
    });

    await this.prisma.auditLog.create({
      data: {
        staffId: staffUser.id,
        action: "Update Student Notes",
        entityType: "Student",
        entityId: studentId,
        changes: {
          notes: { from: student.notes, to: notes },
        },
        metadata: {
          studentName: `${student.firstName} ${student.lastName}`,
          shortCode: student.shortCode,
        },
      },
    });

    return { success: true, notes: updated.notes };
  }

  async delete(id: string, staffUser: RequestStaffUser) {
    await this.ensureExists(id);

    const c = await this.prisma.enrollment.count({ where: { studentId: id } });
    if (c > 0) throw new BadRequestException("Student is currently enrolled!");

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

  private async ensureExists(id: string) {
    const ok = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ok) throw new NotFoundException("Student not found");
  }

  private async deactivateExpiredEnrollments() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      await this.prisma.enrollment.updateMany({
        where: {
          status: "active",
          offering: {
            term: {
              endDate: {
                lt: todayStart,
              },
            },
          },
        },
        data: {
          status: "inactive",
        },
      });
    } catch (error) {
      this.logger.error("Failed to deactivate expired enrollments", error instanceof Error ? error.stack : error);
    }
  }
}
