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

        const compositeKey = `${term.name}_${locationCode}`;
        const termName = `${term.name} (${locationCode})`;

        if (!revenueByTerm[compositeKey]) {
          revenueByTerm[compositeKey] = { termName, revenue: 0 };
        }
        revenueByTerm[compositeKey].revenue += attributedAmount;
      }
    }

    return Object.entries(revenueByTerm)
      .map(([_, data]) => ({
        termId: _, // Composite key
        termName: data.termName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
