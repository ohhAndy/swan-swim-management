import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOfferingInfo(offeringId: string, body: { title: string }, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const offering = await this.prisma.classOffering.findUnique({
      where: { id: offeringId },
    });
    if(!offering) throw new NotFoundException("Offering DNE");

    const updatedOffering = await this.prisma.classOffering.update({
      where: { id: offeringId },
      data: {
        title: body.title,
      }
    });

    await this.prisma.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Update Offering Info",
          entityType: "ClassOffering",
          entityId: updatedOffering.id,
          changes: {
            status: { 
              from: { title: offering.title },
              to: { title: updatedOffering.title },
            },
          },
          metadata: {
            offeringId: updatedOffering.id,
          },
        },
    });

    return { success: true }
  }

  async getOfferingsForTransfer(
    termId: string,
    excludeOfferingId: string,
    level?: string
  ) {
    const offerings = await this.prisma.classOffering.findMany({
      where: {
        termId,
        id: { not: excludeOfferingId },
        ...(level ? { title: { contains: level, mode: "insensitive" } } : {}),
      },
      include: {
        term: true,
        _count: {
          select: { enrollments: { where: { status: "active" } } },
        },
        sessions: {
          orderBy: { date: "asc" },
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    return offerings;
  }
}
