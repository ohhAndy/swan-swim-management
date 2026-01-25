import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AddSkipInput } from "./dto/skips.dto";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class SkipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async addSkip(enrollmentId: string, dto: AddSkipInput, user: any) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, offeringId: true, status: true },
    });
    if (!enrollment) throw new NotFoundException("Enrollment not found");

    const session = await this.prisma.classSession.findUnique({
      where: { id: dto.classSessionId },
      select: { id: true, offeringId: true, status: true },
    });
    if (!session) throw new NotFoundException("Session not found");

    if (enrollment.offeringId !== session.offeringId)
      throw new BadRequestException(
        "Session and Enrollment's offeringId do not match",
      );
    if (enrollment.status !== "active")
      throw new BadRequestException("Only active enrollments can be skipped");
    if (session.status === "canceled")
      throw new BadRequestException("Cannot skip a cancelled session");

    const skip = await this.prisma.enrollmentSkip.upsert({
      where: {
        enrollmentId_classSessionId: {
          enrollmentId,
          classSessionId: dto.classSessionId,
        },
      },
      update: { reason: dto.reason ?? null },
      create: {
        enrollmentId,
        classSessionId: dto.classSessionId,
        reason: dto.reason ?? null,
      },
      select: {
        id: true,
        enrollmentId: true,
        classSessionId: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (staffUser) {
      await this.auditLogsService.create({
        staffId: staffUser.id,
        action: "skip_class",
        entityType: "enrollment_skip",
        entityId: skip.id,
        metadata: {
          enrollmentId,
          classSessionId: dto.classSessionId,
          reason: dto.reason,
        },
      });
    }

    return skip;
  }

  async deleteSkip(enrollmentId: string, classSessionId: string, user: any) {
    try {
      await this.prisma.enrollmentSkip.delete({
        where: {
          enrollmentId_classSessionId: { enrollmentId, classSessionId },
        },
      });

      const staffUser = await this.prisma.staffUser.findUnique({
        where: { authId: user.authId },
      });
      if (staffUser) {
        await this.auditLogsService.create({
          staffId: staffUser.id,
          action: "remove_skip",
          entityType: "enrollment",
          entityId: enrollmentId,
          metadata: { classSessionId },
        });
      }
    } catch {}
    return { ok: true };
  }
}
