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

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  // Calculate suggested amount for an enrollment based on class ratio and skips
  calculateEnrollmentAmount(enrollment: any): number {
    const rates = {
      "3:1": 50,
      "2:1": 73,
      "1:1": 140,
    };

    const rate = rates[enrollment.classRatio as keyof typeof rates] || 50; // Default to 3:1 if unknown
    const totalWeeks = 8; // Standard term length
    const skippedWeeks = enrollment.enrollmentSkips?.length || 0;
    const attendingWeeks = totalWeeks - skippedWeeks;

    return rate * attendingWeeks;
  }

  // Create invoice with line items
  async create(
    createInvoiceDto: CreateInvoiceDto,
    user: any,
    locationId?: string
  ) {
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      include: { accessibleLocations: true },
    });
    if (!staffUser) return;

    // Validate Location Access
    const assignedLocationId =
      validateLocationAccess(staffUser, locationId) ?? undefined;

    // Additional check if user tries to create generically but fails helper logic?
    // Actually helper returns locationId or throws. If null returned (admin global), assignedLocationId is null.
    // However, Prisma might expect null or string.

    // Original logic had some "assignedLocationId = locationId ?? null" for admin.
    // And inferred single location for others.
    // Helper does: return locationId (if passed), return inferred (if not passed), return null (if admin and not passed).

    // So `assignedLocationId` can be string or null.

    // Validate that enrollments aren't already invoiced
    const lineItems: CreateInvoiceLineItemDto[] = createInvoiceDto.lineItems;
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
          `Some enrollments are already on invoices: ${invoiceNumbers}`
        );
      }
    }

    // Create invoice with line items
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: createInvoiceDto.invoiceNumber,
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

    if (validatedLocationId) {
      where.locationId = validatedLocationId;
    }

    // Search by invoice number
    if (query.search) {
      where.invoiceNumber = {
        contains: query.search,
        mode: "insensitive",
      };
    }

    // Filter by status
    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    // Filter by guardian
    if (query.guardianId) {
      where.guardianId = query.guardianId;
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
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
        },
      });
    });

    return this.enrichInvoice(invoice);
  }

  // Get un-invoiced enrollments
  async getUnInvoicedEnrollments(
    query: UnInvoicedEnrollmentsQueryDto,
    user: any,
    locationId?: string
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

    if (validatedLocationId) {
      if (where.offering) {
        where.offering = {
          AND: [where.offering, { term: { locationId: validatedLocationId } }],
        };
      } else {
        where.offering = {
          term: { locationId: validatedLocationId },
        };
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
              term: true,
            },
          },
          enrollmentSkips: true,
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    // Enrich with suggested amounts
    const enrichedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment,
      suggestedAmount: this.calculateEnrollmentAmount(enrollment),
    }));

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
  async remove(id: string) {
    await this.prisma.invoice.delete({
      where: { id },
    });
    return { message: "Invoice deleted successfully" };
  }

  // Helper: Enrich invoice with calculated fields
  private enrichInvoice(invoice: any) {
    const amountPaid =
      invoice.payments?.reduce(
        (sum: number, payment: { amount: number | Prisma.Decimal }) =>
          sum + Number(payment.amount),
        0
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
