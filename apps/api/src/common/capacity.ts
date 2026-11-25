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

/** Filled seats, capacity and open seats for a class */
export function calculateClassUsage(
  enrollments: { classRatio: string | null }[],
  instructorCount: number,
  baseCapacity: number,
): { filled: number; effectiveCapacity: number; openSeats: number } {
  const filled = enrollments.reduce(
    (sum, enr) => sum + getRatioWeight(enr?.classRatio),
    0,
  );
  const dynamicMin = instructorCount >= 2 ? 5 : 0;
  const effectiveCapacity = Math.max(baseCapacity, dynamicMin);
  const openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));
  return { filled, effectiveCapacity, openSeats };
}
