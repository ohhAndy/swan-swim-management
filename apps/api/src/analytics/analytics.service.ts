import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueByLocation() {
    // Fetch all payments with invoice location
    const payments = await this.prisma.payment.findMany({
      select: {
        amount: true,
        invoice: {
          select: {
            locationId: true,
          },
        },
      },
      where: {
        // Optional: filter out voided checks or unrelated payments if needed?
        // Currently assuming all payments in DB are valid revenue
      },
    });

    // Aggregate in memory
    const revenueByLocation: Record<string, number> = {};

    for (const payment of payments) {
      const locationId = payment.invoice?.locationId || "unknown"; // Use string "unknown" for null key
      const amount = Number(payment.amount);

      revenueByLocation[locationId] =
        (revenueByLocation[locationId] || 0) + amount;
    }

    // Fetch location names
    const locations = await this.prisma.location.findMany({
      select: { id: true, name: true },
    });

    return Object.entries(revenueByLocation).map(([locationId, revenue]) => {
      if (locationId === "unknown") {
        return {
          locationId: null,
          locationName: "Unknown Location",
          revenue,
        };
      }

      const location = locations.find((l) => l.id === locationId);
      return {
        locationId,
        locationName: location?.name || "Unknown Location",
        revenue,
      };
    });
  }

  async getRevenueByTerm() {
    // 1. Fetch all payments with deep relations to Term
    const payments = await this.prisma.payment.findMany({
      select: {
        amount: true,
        invoice: {
          select: {
            totalAmount: true,
            location: {
              select: { name: true },
            },
            lineItems: {
              select: {
                amount: true,
                enrollment: {
                  select: {
                    offering: {
                      select: {
                        term: {
                          select: {
                            id: true,
                            name: true,
                            location: {
                              select: { name: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const revenueByTerm: Record<string, { termName: string; revenue: number }> =
      {};

    for (const payment of payments) {
      const invoice = payment.invoice;
      if (!invoice) continue;

      const invoiceTotal = Number(invoice.totalAmount);
      const paymentAmount = Number(payment.amount);

      if (invoiceTotal === 0 || !invoice.lineItems.length) continue;

      // Distribute payment amount to line items
      for (const lineItem of invoice.lineItems) {
        // Only care about line items linked to a Term (via Enrollment -> Offering)
        const term = lineItem.enrollment?.offering?.term;
        if (!term) continue;

        const lineItemAmount = Number(lineItem.amount);

        // Calculate weight: How much of the invoice does this line item represent?
        const weight = lineItemAmount / invoiceTotal;

        // Attribute proportional payment
        const attributedAmount = paymentAmount * weight;

        // Generate key and name for aggregation
        const locationName =
          term.location?.name || invoice.location?.name || "Unknown Location";
        const locationCode = locationName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase();

        const termName = `${term.name} (${locationCode})`;

        if (!revenueByTerm[term.id]) {
          revenueByTerm[term.id] = { termName, revenue: 0 };
        }
        revenueByTerm[term.id].revenue += attributedAmount;
      }
    }

    return Object.entries(revenueByTerm)
      .map(([termId, data]) => ({
        termId,
        termName: data.termName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getTermFinancialDetails(
    termId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const whereClause: any = {
      invoice: {
        lineItems: {
          some: {
            enrollment: {
              offering: {
                termId: termId,
              },
            },
          },
        },
      },
    };

    console.log("getTermFinancialDetails", { termId, startDate, endDate });

    if (startDate) {
      whereClause.paymentDate = {
        ...whereClause.paymentDate,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      whereClause.paymentDate = {
        ...whereClause.paymentDate,
        lte: new Date(endDate),
      };
    }

    // 1. Fetch payments for this term
    // Since payments are linked to invoices, we need to find payments for invoices that have line items for this term.
    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      select: {
        amount: true,
        paymentDate: true,
        invoice: {
          select: {
            totalAmount: true,
            lineItems: {
              select: {
                amount: true,
                enrollment: {
                  select: {
                    offering: {
                      select: {
                        title: true,
                        termId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${payments.length} payments for term ${termId}`);

    const revenueByWeekday: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    const revenueByProgram: Record<string, number> = {};
    let totalRevenue = 0;

    for (const payment of payments) {
      const invoice = payment.invoice;
      if (!invoice) continue;

      const invoiceTotal = Number(invoice.totalAmount);
      const paymentAmount = Number(payment.amount);

      if (invoiceTotal === 0 || !invoice.lineItems.length) continue;

      // Get weekday name (e.g., "Monday")
      const dayName = payment.paymentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // Distribute payment amount to line items
      for (const lineItem of invoice.lineItems) {
        // Only care about line items linked to THIS Term
        const offering = lineItem.enrollment?.offering;
        if (offering?.termId !== termId) continue;

        const lineItemAmount = Number(lineItem.amount);
        const weight = lineItemAmount / invoiceTotal;
        const attributedAmount = paymentAmount * weight;

        // Weekday Revenue
        if (revenueByWeekday[dayName] !== undefined) {
          revenueByWeekday[dayName] += attributedAmount;
        }

        // Program/Offering Revenue
        const programName = offering.title || "Unknown Class";
        revenueByProgram[programName] =
          (revenueByProgram[programName] || 0) + attributedAmount;

        totalRevenue += attributedAmount;
      }
    }

    const weekOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return {
      totalRevenue,
      revenueByWeekday: weekOrder.map((day) => ({
        day,
        revenue: revenueByWeekday[day],
      })),
      revenueByProgram: Object.entries(revenueByProgram)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }
}
