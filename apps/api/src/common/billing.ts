import type {
  InstallmentInput,
  PaymentStanding,
  SwimTeamFeeSuggestion,
  SwimTeamFrequency,
} from "@school/shared-types";

// All dates are UTC calendar dates in "YYYY-MM-DD" form.

const CLASS_RATIO_RATES: Record<string, number> = {
  "3:1": 50,
  "2:1": 73,
  "1:1": 140,
};

export const SWIM_TEAM_FREQUENCIES: SwimTeamFrequency[] = [1, 2, 3, 4];

export const DEFAULT_SWIM_TEAM_MEET_FEES: Record<SwimTeamFrequency, number> = {
  1: 0,
  2: 100,
  3: 425,
  4: 425,
};

function toCents(amount: number | string): number {
  return Math.round((Number(amount) || 0) * 100);
}

function ymd(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function monthIndex(value: string | Date): number {
  const s = ymd(value);
  return Number(s.slice(0, 4)) * 12 + (Number(s.slice(5, 7)) - 1);
}

/** Suggested tuition for an enrollment: per-session rate times sessions attended */
export function calculateEnrollmentTuition(
  ratio: string | null | undefined,
  totalSessions: number,
  skippedSessions?: number,
): number {
  const rate = (ratio && CLASS_RATIO_RATES[ratio]) || 50;
  const attending = Math.max(0, (totalSessions || 0) - (skippedSessions || 0));
  return rate * attending;
}

/** Inclusive number of calendar months a season spans */
export function countSeasonMonths(
  seasonStart: string | Date,
  seasonEnd: string | Date,
): number {
  return Math.max(1, monthIndex(seasonEnd) - monthIndex(seasonStart) + 1);
}

/**
 * Suggested season fees for a swimmer. The practice fee is prorated by the
 * calendar months remaining from the join date; the meet fee never is.
 */
export function calculateSwimTeamFees(
  tier: { practiceFee: number | string; meetFee: number | string },
  competing: boolean,
  seasonStart: string | Date,
  seasonEnd: string | Date,
  joinDate?: string | Date | null,
): SwimTeamFeeSuggestion {
  const totalMonths = countSeasonMonths(seasonStart, seasonEnd);
  const joinIdx = Math.max(
    monthIndex(joinDate || seasonStart),
    monthIndex(seasonStart),
  );
  const remaining = Math.min(
    totalMonths,
    Math.max(0, monthIndex(seasonEnd) - joinIdx + 1),
  );
  const practiceCents = Math.round(
    (toCents(tier.practiceFee) * remaining) / totalMonths,
  );
  return {
    practiceFee: practiceCents / 100,
    meetFee: competing ? toCents(tier.meetFee) / 100 : 0,
    monthsRemaining: remaining,
    seasonMonths: totalMonths,
  };
}

/**
 * Whether enough has been paid as of `today`. With no installments the full
 * invoice total is due immediately.
 */
export function calculateInstallmentStanding(
  installments: InstallmentInput[] | null | undefined,
  totalPaid: number,
  today: string | Date,
  invoiceTotal: number,
): PaymentStanding {
  const todayStr = ymd(today);
  const paidCents = toCents(totalPaid);
  const list = (installments ?? [])
    .map((i) => ({ dueDate: ymd(i.dueDate), cents: toCents(i.amount) }))
    .sort((a, b) =>
      a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0,
    );

  let dueCents = 0;
  let nextDueDate: string | null = null;
  let nextDueAmount: number | null = null;

  if (list.length === 0) {
    dueCents = toCents(invoiceTotal);
  } else {
    let running = 0;
    for (const item of list) {
      running += item.cents;
      if (item.dueDate <= todayStr) {
        dueCents = running;
      } else if (nextDueDate === null && running > paidCents) {
        nextDueDate = item.dueDate;
        nextDueAmount = (running - Math.max(paidCents, dueCents)) / 100;
      }
    }
  }

  const behindCents = Math.max(0, dueCents - paidCents);
  return {
    dueToDate: dueCents / 100,
    paid: paidCents / 100,
    behindAmount: behindCents / 100,
    isBehind: behindCents > 0,
    nextDueDate,
    nextDueAmount,
  };
}
