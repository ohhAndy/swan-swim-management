export type AttendanceStatus = "present" | "absent" | "excused";
export type TrialStatus =
  | "cancelled"
  | "scheduled"
  | "noshow"
  | "attended"
  | "converted";

export type AttendanceMark = {
  id: string;
  status: AttendanceStatus;
  notes?: string | null;
};

export type RosterRow = {
  enrollmentId: string;
  paymentStatus: string | null;
  invoiceNumber: string | null;
  balance: number | null;
  classRatio: string;
  studentId: string;
  studentName: string;
  studentLevel: string | null;
  studentBirthDate: string | null;
  shortCode: string | null;
  notes: string | null;
  attendance: AttendanceMark | null;
  skippedSessionIds: string[];
  reportCardStatus: string | null;
  nextTermStatus: "not_registered" | "enrolled" | "paid";
  enrollmentStatus?: string;
  /** Present only for swim team practice rosters */
  swimTeam?: SwimTeamRosterInfo | null;
};

export type Term = {
  id: string;
  name: string;
  startDate?: string | Date;
  endDate?: string | Date;
  locationId?: string | null;
  type?: "regular" | "swim_team_season";
};

export type SessionSummary = {
  id: string;
  date: string;
  offeringId: string;
  offeringTitle: string;
  offeringNotes: string | null;
  instructors: InstructorInfo[];
};

export type RosterResponse = {
  session: SessionSummary;
  roster: RosterRow[];
  capacity?: number;
  filled?: number;
  openSeats?: number;
  status?: "scheduled" | "canceled" | "completed";
  makeups: MakeupLite[];
  trials: TrialLite[];
};

export type TokenBalance = {
  total: number;
  available: number;
  consumed: number;
  expired: number;
  voided: number;
  overrideCount: number;
};

export type TokenSummary = {
  termId: string;
  termName: string;
  total: number;
  available: number;
  consumed: number;
  expired: number;
  voided: number;
  overrideCount: number;
  tokens?: TokenInfo[];
};

export type TokenInfo = {
  id: string;
  enrollmentId: string;
  /** Effective status — 'expired' is computed at read time from term.endDate, not stored in DB */
  status: "available" | "consumed" | "expired" | "voided";
  grantedAt: string;
  consumedAt: string | null;
  grantedBy: string | null;
  notes: string | null;
  isAutoGranted: boolean;
};

export type MakeupLite = {
  id: string;
  studentId: string;
  studentName: string;
  level: string | null;
  shortCode: string | null;
  status: "requested" | "scheduled" | "attended" | "cancelled" | "missed";
  birthDate: string | null;
  classRatio: string;
  isOverride?: boolean;
  tokenId?: string | null;
};

export type TrialLite = {
  id: string;
  childName: string;
  childAge: number;
  parentPhone: string;
  status: TrialStatus;
  classRatio: string;
  notes: string | null;
};

export type SlotPage = {
  meta: {
    weekday: number;
    startTime: string;
    endTime: string;
    term: Term | null;
    offeringType?: OfferingType;
    /** Swim team seasons are paged by month ("YYYY-MM") */
    month?: string | null;
    months?: string[];
  };
  days: {
    date: string;
    rosters: RosterResponse[];
  }[];
};

export interface InstructorInfo {
  id: string;
  staffUserId: string;
  staffName: string;
}

/**
 * Standard ratio to capacity weights mapping
 */
export const CLASS_RATIO_WEIGHTS: Record<string, number>;

/**
 * Helper to get the numeric seat weight for a class ratio
 */
export function getRatioWeight(ratio?: string | null): number;

/**
 * Standard calculation for class capacity, filled seats, and open seats
 */
export function calculateClassUsage(
  enrollments: { classRatio: string | null }[],
  instructorCount: number,
  baseCapacity: number
): { filled: number; effectiveCapacity: number; openSeats: number };

/**
 * Standard ratio to tuition pricing rates mapping
 */
export const CLASS_RATIO_RATES: Record<string, number>;

/**
 * Helper to get the tuition rate per session for a class ratio
 */
export function getRatioRate(ratio?: string | null): number;

/**
 * Calculate suggested tuition for an enrollment given ratio, total sessions, and skips
 */
export function calculateEnrollmentTuition(
  ratio: string | null | undefined,
  totalSessions: number,
  skippedSessions?: number
): number;



// ---------------------------------------------------------------------------
// Swim team: tiers, season fees and installment plans
// All dates are UTC calendar dates in "YYYY-MM-DD" form.
// ---------------------------------------------------------------------------

export type OfferingType = "regular" | "flexible" | "swim_team";
export type TermType = "regular" | "swim_team_season";
export type SwimTeamFrequency = 1 | 2 | 3 | 4;
export type LineItemFeeType = "swim_team_practice" | "swim_team_meet";

export const SWIM_TEAM_FREQUENCIES: SwimTeamFrequency[];
export const DEFAULT_SWIM_TEAM_MEET_FEES: Record<SwimTeamFrequency, number>;

export interface SwimTeamFeeTier {
  frequency: number;
  practiceFee: number;
  meetFee: number;
}

export interface SwimTeamFeeSuggestion {
  practiceFee: number;
  meetFee: number;
  monthsRemaining: number;
  seasonMonths: number;
}

export interface InstallmentInput {
  dueDate: string | Date;
  amount: number | string;
}

export interface PlannedInstallment {
  dueDate: string;
  amount: number;
}

export interface PaymentStanding {
  /** Amount that should have been paid by today */
  dueToDate: number;
  paid: number;
  behindAmount: number;
  isBehind: boolean;
  nextDueDate: string | null;
  nextDueAmount: number | null;
}

/** What a roster needs to know about a swimmer's season payment */
export interface SwimTeamStanding {
  state: "not_invoiced" | "behind" | "on_track" | "paid";
  /** null when the viewer is not allowed to see amounts */
  behindAmount: number | null;
  nextDueDate: string | null;
}

/** Tier, meet status and payment standing shown beside a swimmer */
export interface SwimTeamRosterInfo {
  registrationId: string;
  frequency: number;
  competing: boolean;
  standing: SwimTeamStanding;
  /** Every practice slot the swimmer holds, including the one being viewed */
  slots: SwimTeamSlotSummary[];
}

export interface SwimTeamSlotSummary {
  offeringId: string;
  enrollmentId: string;
  title: string;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
}

/** Inclusive number of calendar months a season spans */
export function countSeasonMonths(
  seasonStart: string | Date,
  seasonEnd: string | Date
): number;

/**
 * Suggested season fees for a swimmer. The practice fee is prorated by the
 * calendar months remaining from the join date; the meet fee never is.
 */
export function calculateSwimTeamFees(
  tier: { practiceFee: number | string; meetFee: number | string },
  competing: boolean,
  seasonStart: string | Date,
  seasonEnd: string | Date,
  joinDate?: string | Date | null
): SwimTeamFeeSuggestion;

/** Equal monthly installments; the cent remainder lands on the last one */
export function buildInstallmentPlan(
  total: number,
  count: number,
  firstDueDate: string
): PlannedInstallment[];

/**
 * Whether enough has been paid as of `today`. With no installments the full
 * invoice total is due immediately.
 */
export function calculateInstallmentStanding(
  installments: InstallmentInput[] | null | undefined,
  totalPaid: number,
  today: string | Date,
  invoiceTotal: number
): PaymentStanding;
