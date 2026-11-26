import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoiceQueryDto } from "./dto/invoice-query.dto";
import { UnInvoicedEnrollmentsQueryDto } from "./dto/uninvoiced-enrollments-query.dto";
import { Prisma } from "@prisma/client";
import { CreateInvoiceLineItemDto } from "./dto/create-invoice.dto";
import {
  calculateEnrollmentTuition,
  calculateInstallmentStanding,
} from "../common/billing";
import { getTorontoDateString, torontoDayRange } from "../common/date.utils";
import {
  InvoiceInstallmentDto,
  UpdateInstallmentsDto,
} from "./dto/create-invoice.dto";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestStaffUser } from "../auth/auth.types";
import {
  assertCanAccessLocation,
  LocationScope,
  requireSingleLocation,
  scopeFilter,
} from "../auth/location-scope";
import { EnrollmentsService } from "../enrollments/enrollments.service";

export interface EnrollmentForCalculation {
  classRatio?: string | null;
  offering?: {
    sessions?: unknown[];
  } | null;
  totalSessions?: number | null;
  enrollmentSkips?: unknown[] | null;
}

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Classes at one location: that location. Several: staff must choose one.
   * None (POS sale): requested, else fallback, else the request's location.
   */
  private async resolveInvoiceLocation(
    db: Prisma.TransactionClient,
    lines: {
      enrollmentId?: string | null;
      swimTeamRegistrationId?: string | null;
    }[],
    requested: string | null | undefined,
    fallback: string | null,
    scope: LocationScope,
  ): Promise<string> {
    const enrollmentIds = lines.flatMap((l) => l.enrollmentId ?? []);
    const registrationIds = lines.flatMap((l) => l.swimTeamRegistrationId ?? []);

    const [enrollments, registrations] = await Promise.all([
      enrollmentIds.length
        ? db.enrollment.findMany({
            where: { id: { in: enrollmentIds } },
            select: { offering: { select: { term: { select: { locationId: true } } } } },
          })
        : [],
      registrationIds.length
        ? db.swimTeamRegistration.findMany({
            where: { id: { in: registrationIds } },
            select: { term: { select: { locationId: true } } },
          })
        : [],
    ]);
    const billed = [
      ...new Set([
        ...enrollments.map((e) => e.offering.term.locationId),
        ...registrations.map((r) => r.term.locationId),
      ]),
    ];

    const billedNames = async () =>
      (
        await db.location.findMany({
          where: { id: { in: billed } },
          select: { name: true },
          orderBy: { name: "asc" },
        })
      )
        .map((l) => l.name)
        .join(" and ");

    let locationId: string;
    if (billed.length === 1) {
      if (requested && requested !== billed[0]) {
        const name = await billedNames();
        throw new BadRequestException(
          `This invoice bills classes at ${name} only, so it belongs to ${name}.`,
        );
      }
      locationId = billed[0];
    } else if (billed.length > 1) {
      const chosen = requested ?? fallback;
      if (!chosen || !billed.includes(chosen)) {
        throw new BadRequestException(
          `This invoice bills classes at ${await billedNames()}. Choose which of these locations it belongs to.`,
        );
      }
      locationId = chosen;
    } else {
      locationId = requested ?? fallback ?? requireSingleLocation(scope);
    }

    assertCanAccessLocation(scope, locationId);
    return locationId;
  }

  // Calculate suggested amount for an enrollment based on class ratio and skips
  calculateEnrollmentAmount(enrollment: EnrollmentForCalculation): number {
    const totalWeeks =
      enrollment.offering?.sessions?.length ||
      enrollment.totalSessions ||
      0;
    const skippedWeeks = enrollment.enrollmentSkips?.length || 0;
    return calculateEnrollmentTuition(
      enrollment.classRatio,
      totalWeeks,
      skippedWeeks,
    );
  }

  async create(
    createInvoiceDto: CreateInvoiceDto,
    staffUser: RequestStaffUser,
    scope: LocationScope,
  ) {
    const lineItems: CreateInvoiceLineItemDto[] = createInvoiceDto.lineItems;

    const assignedLocationId = await this.resolveInvoiceLocation(
      this.prisma,
      lineItems,
      createInvoiceDto.locationId,
      null,
      scope,
    );

    // Enrollments Validation
    const enrollmentIds: string[] = lineItems
      .filter((item) => item.enrollmentId)
      .map((item) => item.enrollmentId!);

    if (enrollmentIds.length > 0) {
      const alreadyInvoiced = await this.prisma.invoiceLineItem.findMany({
        where: { enrollmentId: { in: enrollmentIds } },
        include: { invoice: true },
      });

      if (alreadyInvoiced.length > 0) {
        const invoiceNumbers = alreadyInvoiced
          .map((item) => item.invoice.invoiceNumber || item.invoice.id)
          .join(", ");
        throw new BadRequestException(
          `Some enrollments are already on invoices: ${invoiceNumbers}`,
        );
      }
    }

    await this.assertSwimTeamLinesValid(lineItems);

    const installments = createInvoiceDto.installments ?? [];
    this.assertInstallmentsMatchTotal(
      installments,
      createInvoiceDto.totalAmount,
    );

    // Invoice Number Logic
    let finalInvoiceNumber = createInvoiceDto.invoiceNumber;
    if (!finalInvoiceNumber) {
      // Auto-generate POS number
      const now = new Date();
      const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
      const hhmmss = now.toISOString().slice(11, 19).replace(/:/g, "");
      finalInvoiceNumber = `POS-${yymmdd}-${hhmmss}`;
    }

    const invoice = await this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        if (item.inventoryItemId) {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
          });

          if (!inventoryItem)
            throw new NotFoundException(
              `Inventory Item ${item.inventoryItemId} not found`,
            );
          if (inventoryItem.stock < 1)
            throw new BadRequestException(
              `Item ${inventoryItem.name} is out of stock`,
            );

          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { stock: { decrement: 1 } },
          });
        }
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          guardianId: createInvoiceDto.guardianId || null,
          locationId: assignedLocationId,
          totalAmount: createInvoiceDto.totalAmount,
          notes: createInvoiceDto.notes,
          createdAt: createInvoiceDto.createdAt
            ? new Date(createInvoiceDto.createdAt)
            : undefined,
          createdBy: staffUser.id,
          status: "partial",
          lineItems: {
            create: lineItems.map((item) => ({
              enrollmentId: item.enrollmentId,
              inventoryItemId: item.inventoryItemId,
              description: item.description,
              amount: item.amount,
              swimTeamRegistrationId: item.swimTeamRegistrationId,
              feeType: item.swimTeamRegistrationId ? item.feeType : undefined,
            })),
          },
          installments: installments.length
            ? {
                create: installments.map((i) => ({
                  dueDate: new Date(`${i.dueDate}T00:00:00.000Z`),
                  amount: i.amount,
                })),
              }
            : undefined,
        },
        include: {
          lineItems: {
            include: {
              enrollment: {
                include: {
                  student: true,
                  offering: {
                    include: {
                      term: true,
                    },
                  },
                },
              },
              swimTeamRegistration: {
                select: {
                  id: true,
                  frequency: true,
                  competing: true,
                  student: { select: { id: true, firstName: true, lastName: true } },
                  term: { select: { id: true, name: true } },
                },
              },
            },
          },
          guardian: true,
          payments: true,
          installments: { orderBy: { dueDate: "asc" } },
          location: true,
        },
      });
    });

    await this.auditLogsService.create({
      staffId: staffUser.id,
      action: "create",
      entityType: "invoice",
      entityId: invoice.id,
      changes: {
        guardianId: invoice.guardianId,
        totalAmount: invoice.totalAmount,
        invoiceNumber: invoice.invoiceNumber,
        isAutoGeneratedNumber: !createInvoiceDto.invoiceNumber,
      },
    });

    return this.enrichInvoice(invoice);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            enrollment: {
              include: {
                student: true,
                offering: {
                  include: {
                    term: true,
                  },
                },
              },
            },
            swimTeamRegistration: {
              select: {
                id: true,
                frequency: true,
                competing: true,
                student: { select: { id: true, firstName: true, lastName: true } },
                term: { select: { id: true, name: true } },
              },
            },
          },
        },
        guardian: true,
        payments: {
          orderBy: { paymentDate: "desc" },
          include: {
            createdByUser: {
              select: { id: true, fullName: true },
            },
          },
        },
        createdByUser: {
          select: { id: true, fullName: true },
        },
        updatedByUser: {
          select: { id: true, fullName: true },
        },
        installments: { orderBy: { dueDate: "asc" } },
        location: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.enrichInvoice(invoice);
  }

  // List invoices with filters
  async findAll(
    query: InvoiceQueryDto,
    scope: LocationScope,
  ) {
    const page = parseInt(query.page ?? "") || 1;
    const limit = parseInt(query.limit ?? "") || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    const locationFilter = scopeFilter(scope);
    if (locationFilter) {
      where.locationId = locationFilter;
    }

    // Search by invoice number
    // Search by invoice number or guardian name
    if (query.search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          guardian: {
            fullName: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Filter by status
    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    // Filter by guardian
    if (query.guardianId) {
      where.guardianId = query.guardianId;
    }

    const createdAt = torontoDayRange(query.startDate, query.endDate);
    if (createdAt) where.createdAt = createdAt;

    // Filter by needsRecovery
    if (query.needsRecovery === "true") {
      where.lineItems = { none: {} };
      where.totalAmount = { gt: 0 };
      where.status = { notIn: ["void", "refunded"] };
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput[] = [
      { [query.sortBy || "createdAt"]: query.sortOrder || "desc" },
    ];

    if ((query.sortBy || "createdAt") === "createdAt") {
      orderBy.push({ invoiceNumber: "desc" });
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          guardian: true,
          lineItems: true,
          payments: true,
          location: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => this.enrichInvoice(inv)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    staffUser: RequestStaffUser,
    scope: LocationScope,
  ) {
    const { lineItems, locationId: requestedLocationId, ...updateData } =
      updateInvoiceDto;

    // Start a transaction to ensure integrity
    const invoice = await this.prisma.$transaction(async (prisma) => {
      // 1. Update basic invoice fields
      await prisma.invoice.update({
        where: { id },
        data: {
          ...updateData,
          createdAt: updateData.createdAt
            ? new Date(updateData.createdAt)
            : undefined,
          updatedBy: staffUser.id,
        },
      });

      // 2. Handle line items if provided
      if (lineItems) {
        const existingItems = await prisma.invoiceLineItem.findMany({
          where: { invoiceId: id },
        });
        const existingIds = new Set(existingItems.map((i) => i.id));
        const newIds = new Set(lineItems.filter((i) => i.id).map((i) => i.id));

        const toDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (toDelete.length > 0) {
          await prisma.invoiceLineItem.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert items (Create or Update)
        for (const item of lineItems) {
          if (item.id && existingIds.has(item.id)) {
            await prisma.invoiceLineItem.update({
              where: { id: item.id },
              data: {
                description: item.description,
                amount: item.amount,
                enrollmentId: item.enrollmentId,
              },
            });
          } else {
            await prisma.invoiceLineItem.create({
              data: {
                invoiceId: id,
                description: item.description!, // Required for create
                amount: item.amount!, // Required for create
                enrollmentId: item.enrollmentId,
                swimTeamRegistrationId: item.swimTeamRegistrationId,
                feeType: item.swimTeamRegistrationId
                  ? item.feeType
                  : undefined,
              },
            });
          }
        }

        // recalculate total amount
        const agg = await prisma.invoiceLineItem.aggregate({
          where: { invoiceId: id },
          _sum: { amount: true },
        });

        await prisma.invoice.update({
          where: { id },
          data: { totalAmount: agg._sum.amount || 0 },
        });
      }

      if (lineItems || requestedLocationId) {
        const [current, savedLines] = await Promise.all([
          prisma.invoice.findUniqueOrThrow({
            where: { id },
            select: { locationId: true },
          }),
          prisma.invoiceLineItem.findMany({
            where: { invoiceId: id },
            select: { enrollmentId: true, swimTeamRegistrationId: true },
          }),
        ]);
        const locationId = await this.resolveInvoiceLocation(
          prisma,
          savedLines,
          requestedLocationId,
          current.locationId,
          scope,
        );
        if (locationId !== current.locationId) {
          await prisma.invoice.update({ where: { id }, data: { locationId } });
        }
      }

      // 3. Return updated invoice with all relations
      return prisma.invoice.findUniqueOrThrow({
        where: { id },
        include: {
          lineItems: {
            include: {
              enrollment: {
                include: {
                  student: true,
                  offering: {
                    include: {
                      term: true,
                    },
                  },
                },
              },
              swimTeamRegistration: {
                select: {
                  id: true,
                  frequency: true,
                  competing: true,
                  student: { select: { id: true, firstName: true, lastName: true } },
                  term: { select: { id: true, name: true } },
                },
              },
            },
          },
          guardian: true,
          payments: true,
          installments: { orderBy: { dueDate: "asc" } },
          location: true,
        },
      });
    });

    // Log the update
    await this.auditLogsService.create({
      staffId: staffUser.id,
      action: "update",
      entityType: "invoice",
      entityId: invoice.id,
      changes: {
        updateData,
        newTotal: invoice.totalAmount,
      },
    });

    return this.enrichInvoice(invoice);
  }

  // Get un-invoiced enrollments (delegated to EnrollmentsService domain owner)
  async getUnInvoicedEnrollments(
    query: UnInvoicedEnrollmentsQueryDto,
    scope: LocationScope,
  ) {
    return this.enrollmentsService.getUnInvoicedEnrollments(query, scope);
  }

  // Delete invoice (admin only, cascades to line items and payments)
  async remove(id: string, staffUser: RequestStaffUser) {
    // First get the invoice to know who we are deleting
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    await this.prisma.invoice.delete({
      where: { id },
    });

    if (staffUser && invoice) {
        await this.auditLogsService.create({
          staffId: staffUser.id,
          action: "delete",
          entityType: "invoice",
          entityId: id,
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
          },
        });
      }

    return { message: "Invoice deleted successfully" };
  }

  // Helper: Enrich invoice with calculated fields
  private enrichInvoice<
    T extends {
      status: string;
      totalAmount: number | Prisma.Decimal;
      payments?: { amount: number | Prisma.Decimal }[];
      installments?: { dueDate: Date; amount: number | Prisma.Decimal }[];
    },
  >(invoice: T) {
    const amountPaid =
      invoice.payments?.reduce(
        (sum: number, payment: { amount: number | Prisma.Decimal }) =>
          sum + Number(payment.amount),
        0,
      ) ?? 0;

    const balance = Number(invoice.totalAmount) - amountPaid;

    // Auto-calculate status based on payments (unless manually voided or refunded)
    let calculatedStatus = invoice.status;
    if (invoice.status !== "void") {
      if (amountPaid >= Number(invoice.totalAmount)) {
        calculatedStatus = "paid";
      } else if (amountPaid <= 0 && (invoice.payments?.length ?? 0) > 0) {
        calculatedStatus = "refunded";
      } else if (amountPaid > 0) {
        calculatedStatus = "partial";
      }
    }

    // Installment plan standing (only when the plan was loaded)
    const plan = invoice.installments;
    const planTotalCents = (plan ?? []).reduce(
      (sum, i) => sum + Math.round(Number(i.amount) * 100),
      0,
    );
    const standing = plan
      ? calculateInstallmentStanding(
          plan.map((i) => ({ dueDate: i.dueDate, amount: Number(i.amount) })),
          amountPaid,
          getTorontoDateString(),
          Number(invoice.totalAmount),
        )
      : undefined;

    return {
      ...invoice,
      amountPaid,
      balance,
      calculatedStatus,
      standing,
      // True when line items were edited after the plan was set up
      installmentsOutOfSync:
        !!plan &&
        plan.length > 0 &&
        planTotalCents !== Math.round(Number(invoice.totalAmount) * 100),
    };
  }

  // Replace an invoice's installment plan
  async updateInstallments(
    id: string,
    dto: UpdateInstallmentsDto,
    staffUser: RequestStaffUser,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: { id: true, totalAmount: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    this.assertInstallmentsMatchTotal(
      dto.installments,
      Number(invoice.totalAmount),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.invoiceInstallment.deleteMany({ where: { invoiceId: id } });
      if (dto.installments.length > 0) {
        await tx.invoiceInstallment.createMany({
          data: dto.installments.map((i) => ({
            invoiceId: id,
            dueDate: new Date(`${i.dueDate}T00:00:00.000Z`),
            amount: i.amount,
          })),
        });
      }
      await this.auditLogsService.create(
        {
          staffId: staffUser.id,
          action: "update installments",
          entityType: "invoice",
          entityId: id,
          changes: { installments: dto.installments },
        },
        tx,
      );
    });

    return this.findOne(id);
  }

  // An installment plan must add up to exactly the invoice total
  private assertInstallmentsMatchTotal(
    installments: InvoiceInstallmentDto[],
    totalAmount: number,
  ) {
    if (installments.length === 0) return;
    const planCents = installments.reduce(
      (sum, i) => sum + Math.round(i.amount * 100),
      0,
    );
    if (planCents !== Math.round(totalAmount * 100)) {
      throw new BadRequestException(
        "Installments must add up to the invoice total",
      );
    }
  }

  // Swim team fee lines: the registration must exist and each fee type can
  // only be invoiced once per registration (ignoring voided invoices)
  private async assertSwimTeamLinesValid(lineItems: CreateInvoiceLineItemDto[]) {
    const swimLines = lineItems.filter((l) => l.swimTeamRegistrationId);
    if (swimLines.length === 0) return;

    const seen = new Set<string>();
    for (const line of swimLines) {
      if (!line.feeType) {
        throw new BadRequestException(
          "Swim team line items need a fee type",
        );
      }
      const key = `${line.swimTeamRegistrationId}:${line.feeType}`;
      if (seen.has(key)) {
        throw new BadRequestException(
          "The same swim team fee appears twice on this invoice",
        );
      }
      seen.add(key);
    }

    const registrationIds = [
      ...new Set(swimLines.map((l) => l.swimTeamRegistrationId!)),
    ];
    const found = await this.prisma.swimTeamRegistration.count({
      where: { id: { in: registrationIds } },
    });
    if (found !== registrationIds.length) {
      throw new NotFoundException("Swim team registration not found");
    }

    const existing = await this.prisma.invoiceLineItem.findMany({
      where: {
        swimTeamRegistrationId: { in: registrationIds },
        invoice: { status: { not: "void" } },
      },
      select: {
        swimTeamRegistrationId: true,
        feeType: true,
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    });
    const clash = existing.find((e) =>
      seen.has(`${e.swimTeamRegistrationId}:${e.feeType}`),
    );
    if (clash) {
      throw new BadRequestException(
        `This swim team fee is already on invoice ${clash.invoice.invoiceNumber || clash.invoice.id}`,
      );
    }
  }
}
