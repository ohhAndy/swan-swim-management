import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReportCardDto } from "./dto/create-report-card.dto";
import { UpdateReportCardDto } from "./dto/update-report-card.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CommunicationsService } from "../communications/communications.service";

@Injectable()
export class ReportCardsService {
  constructor(
    private prisma: PrismaService,
    private communicationsService: CommunicationsService,
  ) {}

  async create(createReportCardDto: CreateReportCardDto) {
    const { skills, ...reportCardData } = createReportCardDto;

    return this.prisma.reportCard.create({
      data: {
        ...reportCardData,
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
  }

  findAll() {
    return this.prisma.reportCard.findMany({
      include: {
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

  async update(id: string, updateReportCardDto: UpdateReportCardDto) {
    const { skills, ...reportCardData } = updateReportCardDto;

    // First update the report card basic data
    const reportCard = await this.prisma.reportCard.update({
      where: { id },
      data: reportCardData,
    });

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

  async emailReportCard(id: string, pdfContent: string) {
    const reportCard = await this.findOne(id);
    const student = reportCard.enrollment.student;
    const guardian = student.guardian;

    if (!guardian?.email) {
      throw new Error("Guardian does not have an email address");
    }

    const termName = reportCard.enrollment.offering.term
      ? reportCard.enrollment.offering.term["name"] // Assuming term has name, need to check if included
      : "Current Term";

    await this.communicationsService.sendEmail({
      recipients: [guardian.email],
      subject: `Report Card for ${student.firstName} - ${termName}`,
      body: `Dear ${guardian.fullName},\n\nPlease find attached the report card for ${student.firstName}.\n\nBest regards,\nSwan Swim School`,
      attachments: [
        {
          filename: `Report_Card_${student.firstName}_${student.lastName}.pdf`,
          content: pdfContent,
        },
      ],
    });

    // Update status to sent
    await this.prisma.reportCard.update({
      where: { id },
      data: { status: "sent" },
    });

    return { success: true };
  }
}
