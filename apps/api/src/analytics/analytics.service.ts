import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueByLocation() {
    // Group invoices by location and sum totalAmount
    // Filtering for paid or partial status to reflect actual/expected revenue
    const data = await this.prisma.invoice.groupBy({
      by: ["locationId"],
      _sum: {
        totalAmount: true,
      },
      where: {
        status: { in: ["paid", "partial"] },
        locationId: { not: null },
      },
    });

    // We need location names, so we fetch them and map
    const locations = await this.prisma.location.findMany({
      select: { id: true, name: true },
    });

    return data.map((item) => {
      const location = locations.find((l) => l.id === item.locationId);
      return {
        locationId: item.locationId,
        locationName: location?.name || "Unknown Location",
        revenue: item._sum.totalAmount || 0,
      };
    });
  }

  async getRevenueByTerm() {
    // This is more complex because Invoice doesn't directly map to Term for all line items.
    // We'll rely on InvoiceLineItem -> Enrollment -> Offering -> Term

    // 1. Fetch all paid/partial invoices
    // 2. Aggregate line item amounts by term

    // Ideally we'd use groupBy, but deep relation aggregation is tricky in Prisma groupBy.
    // We'll fetch relevant line items and aggregate in memory or use raw query if performance dictates later.
    // For now, let's try a finding line items with enrollment relations.

    const lineItems = await this.prisma.invoiceLineItem.findMany({
      where: {
        invoice: {
          status: { in: ["paid", "partial"] },
        },
        enrollmentId: { not: null },
      },
      select: {
        amount: true,
        invoice: {
          select: {
            location: {
              select: { name: true },
            },
          },
        },
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
    });

    const revenueByTerm: Record<string, { termName: string; revenue: number }> =
      {};

    for (const item of lineItems) {
      if (!item.enrollment?.offering?.term) continue;
      const term = item.enrollment.offering.term;

      // Prioritize Term Location (if specific), fall back to Invoice Location (if term is global)
      const locationName =
        term.location?.name ||
        item.invoice?.location?.name ||
        "Unknown Location";

      // Abbreviate location name: "Markham" -> "M", "Angus Glen" -> "AG"
      const locationCode = locationName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();

      // Use Name + Location as key to merge duplicate terms (same name/location but different IDs)
      // This solves the issue where multiple terms with the same name/location were showing as duplicates
      const compositeKey = `${term.name}_${locationCode}`;
      const termName = `${term.name} (${locationCode})`;

      const amount = Number(item.amount); // Decimal to number

      if (!revenueByTerm[compositeKey]) {
        revenueByTerm[compositeKey] = { termName, revenue: 0 };
      }
      revenueByTerm[compositeKey].revenue += amount;
    }

    return Object.entries(revenueByTerm)
      .map(([_, data]) => ({
        // We don't really use the ID on frontend for display, so composite key is fine or just omit
        termId: _,
        termName: data.termName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue); // Sort by revenue desc
  }
}
