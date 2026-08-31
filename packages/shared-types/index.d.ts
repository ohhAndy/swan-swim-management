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
};

export type Term = {
  id: string;
  name: string;
  startDate?: string | Date;
  endDate?: string | Date;
  locationId?: string | null;
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

export type MakeupLite = {
  id: string;
  studentId: string;
  studentName: string;
  level: string | null;
  shortCode: string | null;
  status: "requested" | "scheduled" | "attended" | "cancelled" | "missed";
  birthDate: string | null;
  classRatio: string;
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


