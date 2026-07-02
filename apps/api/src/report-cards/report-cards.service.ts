import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateReportCardDto } from "./dto/create-report-card.dto";
import { UpdateReportCardDto } from "./dto/update-report-card.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CommunicationsService } from "../communications/communications.service";
import { AuthenticatedUser } from "../auth/auth.types";

@Injectable()
export class ReportCardsService {
  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
  ) {}

  async create(
    createReportCardDto: CreateReportCardDto,
    user: AuthenticatedUser,
  ) {
    const { skills, ...reportCardData } = createReportCardDto;

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) throw new Error("Staff user not found");

    const reportCard = await this.prisma.reportCard.create({
      data: {
        ...reportCardData,
        createdBy: staffUser.id,
        reportCardSkills: {
          create: skills?.map((skill) => ({
            skillId: skill.skillId,
            status: skill.status,
          })),
        },
      },
      include: {
        reportCardSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    // Sync report card status back to the Enrollment
    await this.prisma.enrollment.update({
      where: { id: reportCard.enrollmentId },
      data: { reportCardStatus: reportCard.status },
    });

    // Automatically upgrade student level if report card is created as completed
    if (reportCard.status === "completed" && reportCard.levelId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: reportCard.enrollmentId },
        include: { student: { include: { levelModel: true } } },
      });

      if (enrollment) {
        const currentLevel = await this.prisma.level.findUnique({
          where: { id: reportCard.levelId },
        });

        if (currentLevel) {
          const nextLevel = await this.prisma.level.findFirst({
            where: { order: { gt: currentLevel.order } },
            orderBy: { order: "asc" },
          });

          if (nextLevel) {
            const studentCurrentLevelOrder =
              enrollment.student.levelModel?.order ?? -1;
            if (nextLevel.order > studentCurrentLevelOrder) {
              await this.prisma.student.update({
                where: { id: enrollment.studentId },
                data: { level: nextLevel.name, levelId: nextLevel.id },
              });
            }
          }
        }
      }
    }

    return reportCard;
  }

  findAll() {
    return this.prisma.reportCard.findMany({
      include: {
        createdByUser: {
          select: {
            fullName: true,
          },
        },
        updatedByUser: {
          select: {
            fullName: true,
          },
        },
        sentByUser: {
          select: {
            fullName: true,
          },
        },
        enrollment: {
          include: {
            student: true,
            offering: true,
          },
        },
        level: true,
        reportCardSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const reportCard = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            fullName: true,
          },
        },
        updatedByUser: {
          select: {
            fullName: true,
          },
        },
        sentByUser: {
          select: {
            fullName: true,
          },
        },
        enrollment: {
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
        },
        level: {
          include: {
            skills: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        reportCardSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!reportCard) {
      throw new NotFoundException(`Report card with ID ${id} not found`);
    }

    return reportCard;
  }

  async update(
    id: string,
    updateReportCardDto: UpdateReportCardDto,
    user: AuthenticatedUser,
  ) {
    const { skills, ...reportCardData } = updateReportCardDto;

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) throw new Error("Staff user not found");

    // Fetch existing report card to check its status before updating
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        enrollment: { include: { student: { include: { levelModel: true } } } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Report card with ID ${id} not found`);
    }

    // Enforce that completed/sent report cards cannot be edited
    if (existing.status === "completed" || existing.status === "sent") {
      throw new ForbiddenException(
        "Cannot modify a completed or sent report card",
      );
    }

    // Enforce that if role is supervisor, they can only modify a report card they created
    if (
      staffUser.role === "supervisor" &&
      existing.createdBy !== staffUser.id
    ) {
      throw new ForbiddenException(
        "Supervisors can only modify report cards they created",
      );
    }

    // First update the report card basic data
    const reportCard = await this.prisma.reportCard.update({
      where: { id },
      data: {
        ...reportCardData,
        updatedBy: staffUser.id,
      },
    });

    // Sync report card status back to the Enrollment
    await this.prisma.enrollment.update({
      where: { id: existing.enrollmentId },
      data: { reportCardStatus: reportCard.status },
    });

    // Automatically upgrade student level if report card is marked as completed
    if (reportCard.status === "completed") {
      const levelIdToUse = reportCard.levelId || existing.levelId;
      if (levelIdToUse) {
        const currentLevel = await this.prisma.level.findUnique({
          where: { id: levelIdToUse },
        });

        if (currentLevel) {
          const nextLevel = await this.prisma.level.findFirst({
            where: { order: { gt: currentLevel.order } },
            orderBy: { order: "asc" },
          });

          if (nextLevel) {
            const studentCurrentLevelOrder =
              existing.enrollment.student.levelModel?.order ?? -1;
            if (nextLevel.order > studentCurrentLevelOrder) {
              await this.prisma.student.update({
                where: { id: existing.enrollment.studentId },
                data: { level: nextLevel.name, levelId: nextLevel.id },
              });
            }
          }
        }
      }
    }

    // If skills are provided, upsert them
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        // Check if a record already exists for this report card and skill
        const existingSkill = await this.prisma.reportCardSkill.findUnique({
          where: {
            reportCardId_skillId: {
              reportCardId: id,
              skillId: skill.skillId,
            },
          },
        });

        if (existingSkill) {
          await this.prisma.reportCardSkill.update({
            where: {
              reportCardId_skillId: {
                reportCardId: id,
                skillId: skill.skillId,
              },
            },
            data: {
              status: skill.status,
            },
          });
        } else {
          await this.prisma.reportCardSkill.create({
            data: {
              reportCardId: id,
              skillId: skill.skillId,
              status: skill.status,
            },
          });
        }
      }
    }

    return this.findOne(id);
  }

  remove(id: string) {
    return this.prisma.reportCard.delete({
      where: { id },
    });
  }

  async emailReportCard(
    id: string,
    pdfContent: string,
    user: AuthenticatedUser,
  ) {
    const reportCard = await this.findOne(id);
    if (reportCard.status === "sent") {
      throw new ForbiddenException("This report card has already been sent.");
    }

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) throw new Error("Staff user not found");

    const student = reportCard.enrollment.student;
    const guardian = student.guardian;

    if (!guardian?.email) {
      throw new Error("Guardian does not have an email address");
    }

    const termName = reportCard.enrollment.offering.term
      ? reportCard.enrollment.offering.term["name"]
      : "Current Term";

    await this.communicationsService.sendEmail({
      recipients: [guardian.email],
      subject: `Progress Report for ${student.firstName} - ${termName}`,
      body: `Dear ${guardian.fullName},\n\nPlease find attached the progress report for ${student.firstName}.\n\nBest regards,\nSwan Swim School`,
      attachments: [
        {
          filename: `Progress_Report_${student.firstName}_${student.lastName}.pdf`,
          content: pdfContent,
        },
      ],
    });

    // Update status, sentAt, and sentById
    await this.prisma.reportCard.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        sentById: staffUser.id,
      },
    });

    // Sync reportCardStatus to enrollment
    await this.prisma.enrollment.update({
      where: { id: reportCard.enrollmentId },
      data: { reportCardStatus: "sent" },
    });

    return { success: true };
  }
}
