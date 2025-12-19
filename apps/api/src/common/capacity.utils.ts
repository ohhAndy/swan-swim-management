/**
 * Standardizes the calculation of class capacity and filled seats based on custom weighting rules.
 *
 * Rules:
 * 1. Usage Weights:
 *    - "1:1" = 3.0 slots
 *    - "2:1" = 1.5 slots
 *    - "3:1" = 1.0 slot (standard)
 *    - Default = 1.0 slot
 *
 * 2. Effective Capacity:
 *    - Base is DB capacity.
 *    - If 2+ instructors are assigned, minimum capacity becomes 5.
 *    - Effective = Math.max(dbCapacity, (instructors >= 2 ? 5 : 0))
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
