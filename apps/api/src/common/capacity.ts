import type {
  AttendanceStatus,
  EnrollmentStatus,
  MakeUpStatus,
  OfferingType,
  TrialStatus,
} from "@prisma/client";

export const CLASS_RATIO_WEIGHTS: Record<string, number> = {
  "1:1": 3.0,
  "2:1": 1.5,
  "3:1": 1.0,
};

/** Seats a student takes up in a class, based on their instructor ratio */
export function getRatioWeight(ratio?: string | null): number {
  if (!ratio) return 1.0;
  return CLASS_RATIO_WEIGHTS[ratio] ?? 1.0;
}

/** Lessons with 2+ instructors hold at least 5 seats; practices are plain headcount */
export function getEffectiveCapacity(
  baseCapacity: number,
  instructorCount: number,
  offeringType?: OfferingType | null,
): number {
  if (offeringType === "swim_team" || instructorCount < 2) return baseCapacity;
  return Math.max(baseCapacity, 5);
}

export function enrollmentHoldsSeat(enrollment: {
  status: EnrollmentStatus;
  skipped?: boolean;
  attendanceStatus?: AttendanceStatus | null;
}): boolean {
  return (
    enrollment.status === "active" &&
    !enrollment.skipped &&
    enrollment.attendanceStatus !== "excused" &&
    enrollment.attendanceStatus !== "absent"
  );
}

export function makeupHoldsSeat(status: MakeUpStatus): boolean {
  return status === "scheduled" || status === "attended";
}

export function trialHoldsSeat(status: TrialStatus): boolean {
  return status !== "cancelled";
}

export interface ClassUsage {
  filled: number;
  effectiveCapacity: number;
  openSeats: number;
}

function usage(filled: number, effectiveCapacity: number): ClassUsage {
  const openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));
  return { filled, effectiveCapacity, openSeats };
}

/** Seats taken across the whole term by active enrollments */
export function calculateClassUsage(
  enrollments: { classRatio: string | null }[],
  instructorCount: number,
  baseCapacity: number,
  offeringType?: OfferingType | null,
): ClassUsage {
  const filled = enrollments.reduce(
    (sum, enr) => sum + getRatioWeight(enr.classRatio),
    0,
  );
  return usage(
    filled,
    getEffectiveCapacity(baseCapacity, instructorCount, offeringType),
  );
}

export interface SessionUsageInput {
  baseCapacity: number;
  instructorCount: number;
  offeringType?: OfferingType | null;
  enrollments: {
    status: EnrollmentStatus;
    classRatio: string | null;
    skipped?: boolean;
    attendanceStatus?: AttendanceStatus | null;
  }[];
  makeups: { status: MakeUpStatus; classRatio: string | null }[];
  trials: { status: TrialStatus; classRatio: string | null }[];
}

/** Seats taken in one session by regulars, makeups and trials */
export function calculateSessionUsage(input: SessionUsageInput): ClassUsage {
  let filled = 0;
  for (const e of input.enrollments) {
    if (enrollmentHoldsSeat(e)) filled += getRatioWeight(e.classRatio);
  }
  for (const m of input.makeups) {
    if (makeupHoldsSeat(m.status)) filled += getRatioWeight(m.classRatio);
  }
  for (const t of input.trials) {
    if (trialHoldsSeat(t.status)) filled += getRatioWeight(t.classRatio);
  }
  return usage(
    filled,
    getEffectiveCapacity(
      input.baseCapacity,
      input.instructorCount,
      input.offeringType,
    ),
  );
}
