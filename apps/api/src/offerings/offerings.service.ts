import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOfferingInfo(
    offeringId: string,
    body: { title: string },
    user: any
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const offering = await this.prisma.classOffering.findUnique({
      where: { id: offeringId },
    });
    if (!offering) throw new NotFoundException("Offering DNE");

    const updatedOffering = await this.prisma.classOffering.update({
      where: { id: offeringId },
      data: {
        title: body.title,
      },
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

    return { success: true };
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

  async createOffering(
    data: {
      termId: string;
      weekday: number;
      startTime: string; // HH:MM
      title: string;
      capacity: number;
      notes?: string;
    },
    user: any
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const term = await this.prisma.term.findUnique({
      where: { id: data.termId },
    });
    if (!term) throw new NotFoundException("Term not found");

    const DURATION = 45;

    const [h, m] = data.startTime.split(":").map(Number);
    const total = h * 60 + m + DURATION;
    const hh = Math.floor((total % (24 * 60)) / 60.0);
    const mm = total % 60;
    const endTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(
      2,
      "0"
    )}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Offering
      const offering = await tx.classOffering.create({
        data: {
          termId: data.termId,
          weekday: data.weekday,
          startTime: data.startTime,
          endTime,
          duration: DURATION,
          title: data.title,
          capacity: data.capacity,
          notes: data.notes ?? null,
        },
      });

      // 2. Generate Sessions
      // We need to find all dates in the term that match this weekday
      const start = new Date(term.startDate);
      const end = new Date(term.endDate);

      const dates: Date[] = [];
      const cur = new Date(start);
      // Set to noon UTC to avoid timezone shifts
      cur.setUTCHours(12, 0, 0, 0);

      // Advance to first matching weekday
      while (cur.getUTCDay() !== data.weekday) {
        cur.setDate(cur.getDate() + 1);
      }

      while (cur <= end) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
      }

      if (dates.length > 0) {
        await tx.classSession.createMany({
          data: dates.map((d) => ({
            offeringId: offering.id,
            date: d,
            status: "scheduled",
            notes: null,
          })),
        });
      }

      // 3. Audit
      await tx.auditLog.create({
        data: {
          staffId: staffUser.id,
          action: "Create Class Offering",
          entityType: "ClassOffering",
          entityId: offering.id,
          metadata: {
            title: offering.title,
            termId: term.id,
          },
        },
      });

      return offering;
    });
  }

  async deleteOffering(offeringId: string, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    // Check for enrollments
    const enrollments = await this.prisma.enrollment.count({
      where: { offeringId, status: "active" },
    });

    if (enrollments > 0) {
      throw new BadRequestException(
        "Cannot delete offering with active enrollments."
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete sessions first (cascade might handle this, but safer to be explicit or rely on schema)
      // Assuming cascade is NOT set up for safety, usually we delete sessions.
      // But actually, sessions have foreign key to offering.
      await tx.classSession.deleteMany({
        where: { offeringId },
      });

      const deleted = await tx.classOffering.delete({
        where: { id: offeringId },
      });

      if (staffUser) {
        await tx.auditLog.create({
          data: {
            staffId: staffUser.id,
            action: "Delete Class Offering",
            entityType: "ClassOffering",
            entityId: offeringId,
            metadata: {
              title: deleted.title,
            },
          },
        });
      }

      return deleted;
    });
  }
}
