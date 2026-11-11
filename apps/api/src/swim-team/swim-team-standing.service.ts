import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  calculateInstallmentStanding,
  type SwimTeamStanding,
} from "@school/shared-types";
import { getTorontoDateString } from "../common/date.utils";

export interface RegistrationStanding extends SwimTeamStanding {
  behindAmount: number;
  invoiceIds: string[];
}

const NOT_INVOICED: RegistrationStanding = {
  state: "not_invoiced",
  behindAmount: 0,
  nextDueDate: null,
  invoiceIds: [],
};

/** Roles allowed to see dollar amounts on rosters */
const AMOUNT_ROLES = new Set(["super_admin", "admin", "manager"]);

/**
 * Works out whether a swimmer has paid enough of their season invoice(s) as
 * of today. Kept separate from the registrations service so the schedule and
 * attendance modules can use it without pulling in the rest of the module.
 */
@Injectable()
export class SwimTeamStandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStandings(
    registrationIds: string[],
    today: string = getTorontoDateString(),
  ): Promise<Map<string, RegistrationStanding>> {
    const result = new Map<string, RegistrationStanding>();
    const ids = [...new Set(registrationIds)];
    if (ids.length === 0) return result;

    const lines = await this.prisma.invoiceLineItem.findMany({
      where: {
        swimTeamRegistrationId: { in: ids },
        invoice: { status: { not: "void" } },
      },
      select: { swimTeamRegistrationId: true, invoiceId: true },
    });

    const invoiceIds = [...new Set(lines.map((l) => l.invoiceId))];
    const invoices = invoiceIds.length
      ? await this.prisma.invoice.findMany({
          where: { id: { in: invoiceIds } },
          select: {
            id: true,
            totalAmount: true,
            payments: { select: { amount: true } },
            installments: { select: { dueDate: true, amount: true } },
          },
        })
      : [];

    const invoiceStanding = new Map(
      invoices.map((inv) => {
        const total = Number(inv.totalAmount);
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const standing = calculateInstallmentStanding(
          inv.installments.map((i) => ({
            dueDate: i.dueDate,
            amount: Number(i.amount),
          })),
          paid,
          today,
          total,
        );
        return [inv.id, { ...standing, fullyPaid: paid >= total }] as const;
      }),
    );

    const invoicesByRegistration = new Map<string, Set<string>>();
    for (const line of lines) {
      if (!line.swimTeamRegistrationId) continue;
      const set =
        invoicesByRegistration.get(line.swimTeamRegistrationId) ?? new Set();
      set.add(line.invoiceId);
      invoicesByRegistration.set(line.swimTeamRegistrationId, set);
    }

    for (const id of ids) {
      const invIds = [...(invoicesByRegistration.get(id) ?? [])];
      if (invIds.length === 0) {
        result.set(id, NOT_INVOICED);
        continue;
      }

      let behindCents = 0;
      let allPaid = true;
      let nextDueDate: string | null = null;
      for (const invId of invIds) {
        const s = invoiceStanding.get(invId);
        if (!s) continue;
        behindCents += Math.round(s.behindAmount * 100);
        if (!s.fullyPaid) allPaid = false;
        if (s.nextDueDate && (!nextDueDate || s.nextDueDate < nextDueDate)) {
          nextDueDate = s.nextDueDate;
        }
      }

      result.set(id, {
        state: behindCents > 0 ? "behind" : allPaid ? "paid" : "on_track",
        behindAmount: behindCents / 100,
        nextDueDate,
        invoiceIds: invIds,
      });
    }

    return result;
  }

  async getStanding(
    registrationId: string,
    today?: string,
  ): Promise<RegistrationStanding> {
    const map = await this.getStandings([registrationId], today);
    return map.get(registrationId) ?? NOT_INVOICED;
  }

  /** Strips dollar amounts for roles that should only see the status */
  static forRole(
    standing: RegistrationStanding | undefined,
    role: string | undefined,
  ): SwimTeamStanding {
    const s = standing ?? NOT_INVOICED;
    return {
      state: s.state,
      behindAmount: role && AMOUNT_ROLES.has(role) ? s.behindAmount : null,
      nextDueDate: s.nextDueDate,
    };
  }
}
