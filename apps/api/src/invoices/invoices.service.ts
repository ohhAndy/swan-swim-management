import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { validateLocationAccess } from "../common/helpers/location-access.helper";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoiceQueryDto } from "./dto/invoice-query.dto";
import { UnInvoicedEnrollmentsQueryDto } from "./dto/uninvoiced-enrollments-query.dto";
import { Prisma } from "@prisma/client";
import { CreateInvoiceLineItemDto } from "./dto/create-invoice.dto";

import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Calculate suggested amount for an enrollment based on class ratio and skips
  calculateEnrollmentAmount(enrollment: any): number {
    const rates = {
      "3:1": 50,
      "2:1": 73,
      "1:1": 140,
    };

    const rate = rates[enrollment.classRatio as keyof typeof rates] || 50; // Default to 3:1 if unknown
    const totalWeeks =
      (enrollment.offering as any)?.sessions?.length ||
      (enrollment as any).totalSessions ||
      8; // Fallback to 8 if not found
    const skippedWeeks = enrollment.enrollmentSkips?.length || 0;
    const attendingWeeks = totalWeeks - skippedWeeks;

    return rate * attendingWeeks;
  }

  // Create invoice with line items
  async create(
    createInvoiceDto: CreateInvoiceDto,
    user: any,
    locationId?: string,
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });
    if (!staffUser) return;

    // Validate Location Access
    const assignedLocationId =
      validateLocationAccess(staffUser, locationId) ?? undefined;

    const lineItems: CreateInvoiceLineItemDto[] = createInvoiceDto.lineItems;

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

    // Invoice Number Logic
    let finalInvoiceNumber = createInvoiceDto.invoiceNumber;
    if (!finalInvoiceNumber) {
      // Auto-generate POS number
      const now = new Date();
      const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
      const hhmmss = now.toISOString().slice(11, 19).replace(/:/g, "");
      finalInvoiceNumber = `POS-${yymmdd}-${hhmmss}`;
    }

    // Prepare Invoice Data
    const invoice = await this.prisma.$transaction(async (tx) => {
      // Decrement Stock for Inventory Items
      for (const item of lineItems) {
        if (item.inventoryItemId) {
          // Check stock
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

          // Decrement
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
            })),
          },
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
            },
          },
          guardian: true,
          payments: true,
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

  // Get invoice by ID
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
        location: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.enrichInvoice(invoice);
  }

  // List invoices with filters
  async findAll(query: InvoiceQueryDto, user: any, locationId?: string) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });
    if (!staffUser) throw new ForbiddenException("User not found");

    const validatedLocationId = validateLocationAccess(staffUser, locationId);
    const page = parseInt(query.page ?? "") || 1;
    const limit = parseInt(query.limit ?? "") || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    const includeAllLocations = query.includeAllLocations === "true";

    if (validatedLocationId && !includeAllLocations) {
      where.locationId = validatedLocationId;
    } else if (
      includeAllLocations &&
      !["admin", "super_admin"].includes(staffUser.role)
    ) {
      const accessibleLocationIds = staffUser.accessibleLocations.map(
        (l: any) => l.id,
      );
      where.locationId = { in: accessibleLocationIds };
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

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Filter by needsRecovery
    if (query.needsRecovery === "true") {
      where.lineItems = { none: {} };
      where.totalAmount = { gt: 0 };
      where.status = { not: "void" };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || "createdAt"]: query.sortOrder || "desc",
        },
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

  // Update invoice
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, user: any) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
    });
    if (!staffUser) return;

    const { lineItems, ...updateData } = updateInvoiceDto;

    // Start a transaction to ensure integrity
    const invoice = await this.prisma.$transaction(async (prisma) => {
      // 1. Update basic invoice fields
      await prisma.invoice.update({
        where: { id },
        data: {
          ...updateData,
          locationId: updateData.locationId,
          createdAt: updateData.createdAt
            ? new Date(updateData.createdAt)
            : undefined,
          updatedBy: staffUser.id,
        },
      });

      // 2. Handle line items if provided
      if (lineItems) {
        // Get existing items to know what to delete
        const existingItems = await prisma.invoiceLineItem.findMany({
          where: { invoiceId: id },
        });
        const existingIds = new Set(existingItems.map((i) => i.id));
        const newIds = new Set(lineItems.filter((i) => i.id).map((i) => i.id));

        // Delete items that are no longer present
        const toDelete = [...existingIds].filter((id) => !newIds.has(id));
        if (toDelete.length > 0) {
          await prisma.invoiceLineItem.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert items (Create or Update)
        for (const item of lineItems) {
          if (item.id && existingIds.has(item.id)) {
            // Update existing
            await prisma.invoiceLineItem.update({
              where: { id: item.id },
              data: {
                description: item.description,
                amount: item.amount,
                enrollmentId: item.enrollmentId,
              },
            });
          } else {
            // Create new
            await prisma.invoiceLineItem.create({
              data: {
                invoiceId: id,
                description: item.description!, // Required for create
                amount: item.amount!, // Required for create
                enrollmentId: item.enrollmentId,
              },
            });
          }
        }

        // recalculate total amount
        const agg = await prisma.invoiceLineItem.aggregate({
          where: { invoiceId: id },
          _sum: { amount: true },
        });

        // Update the invoice total
        await prisma.invoice.update({
          where: { id },
          data: { totalAmount: agg._sum.amount || 0 },
        });
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
            },
          },
          guardian: true,
          payments: true,
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

  // Get un-invoiced enrollments
  async getUnInvoicedEnrollments(
    query: UnInvoicedEnrollmentsQueryDto,
    user: any,
    locationId?: string,
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });
    if (!staffUser) throw new ForbiddenException("User not found");

    const validatedLocationId = validateLocationAccess(staffUser, locationId);
    const page = parseInt(query.page ?? "") || 1;
    const limit = parseInt(query.limit ?? "") || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      invoiceLineItem: null, // Not linked to any invoice
      status: "active", // Only active enrollments
    };

    if (query.guardianId) {
      where.student = {
        guardianId: query.guardianId,
      };
    }

    if (query.termId) {
      where.offering = {
        termId: query.termId,
      };
    }

    const includeAllLocations = query.includeAllLocations === "true";

    // Only filter by specific location if NOT including all, or if strictly required by validation
    // We still run validation to ensure the user isn't spoofing the header if provided
    if (validatedLocationId && !includeAllLocations) {
      if (where.offering) {
        where.offering = {
          AND: [where.offering, { term: { locationId: validatedLocationId } }],
        };
      } else {
        where.offering = {
          term: { locationId: validatedLocationId },
        };
      }
    } else if (
      includeAllLocations &&
      !["admin", "super_admin"].includes(staffUser.role)
    ) {
      // If including all locations but user is NOT admin/super_admin, restrict to accessible locations
      const accessibleLocationIds = staffUser.accessibleLocations.map(
        (l: any) => l.id,
      );

      const locationFilter = {
        term: { locationId: { in: accessibleLocationIds } },
      };

      if (where.offering) {
        where.offering = {
          AND: [where.offering, locationFilter],
        };
      } else {
        where.offering = locationFilter;
      }
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ student: { guardianId: "asc" } }, { createdAt: "desc" }],
        include: {
          student: {
            include: {
              guardian: true,
            },
          },
          offering: {
            include: {
              term: {
                include: {
                  location: true,
                },
              },
              sessions: {
                select: { id: true },
              },
            },
          },
          enrollmentSkips: true,
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    // Enrich with suggested amounts
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const totalSessions = enrollment.offering.sessions.length;
      return {
        ...enrollment,
        totalSessions,
        suggestedAmount: this.calculateEnrollmentAmount({
          ...enrollment,
          totalSessions,
        }),
      };
    });

    return {
      data: enrichedEnrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Delete invoice (admin only, cascades to line items and payments)
  async remove(id: string, user?: any) {
    // We need user context for audit logs.
    // If not provided (legacy calls?), we might skip or fail?
    // Assuming controller will be updated to pass it.

    // First get the invoice to know who we are deleting
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    await this.prisma.invoice.delete({
      where: { id },
    });

    if (user && invoice) {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { authId: user.authId },
      });
      if (staffUser) {
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
    }

    return { message: "Invoice deleted successfully" };
  }

  // Helper: Enrich invoice with calculated fields
  private enrichInvoice(invoice: any) {
    const amountPaid =
      invoice.payments?.reduce(
        (sum: number, payment: { amount: number | Prisma.Decimal }) =>
          sum + Number(payment.amount),
        0,
      ) ?? 0;

    const balance = Number(invoice.totalAmount) - amountPaid;

    // Auto-calculate status based on payments (unless manually voided)
    let calculatedStatus = invoice.status;
    if (invoice.status !== "void") {
      if (amountPaid >= Number(invoice.totalAmount)) {
        calculatedStatus = "paid";
      } else if (amountPaid > 0) {
        calculatedStatus = "partial";
      }
    }

    return {
      ...invoice,
      amountPaid,
      balance,
      calculatedStatus,
    };
  }
}
