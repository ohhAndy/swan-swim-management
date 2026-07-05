/**
 * Standardizes the calculation of class capacity and filled seats based on custom weighting rules.
 * 
 * [WARNING] Duplicated Logic:
 * This function must remain 100% identical to the backend logic in
 * apps/api/src/common/capacity.utils.ts. If you edit the capacity weights
 * or effective capacity thresholds here, you MUST update them there as well.
 */
export function calculateClassUsage(
  enrollments: { classRatio: string | null }[],
  instructorCount: number,
  baseCapacity: number
) {
  let filled = 0;

  for (const enr of enrollments) {
    const ratio = enr.classRatio || "3:1";
    if (ratio === "1:1") {
      filled += 3;
    } else if (ratio === "2:1") {
      filled += 1.5;
    } else if (ratio === "3:1") {
      filled += 1;
    } else {
      filled += 1; // Default
    }
  }

  // Dynamic capacity rule: 2 instructors -> implies min 5 capacity
  const dynamicMin = instructorCount >= 2 ? 5 : 0;
  const effectiveCapacity = Math.max(baseCapacity, dynamicMin);

  // Open seats cannot be negative
  const openSeats = Math.max(0, Math.floor(effectiveCapacity - filled));

  return { filled, effectiveCapacity, openSeats };
}
