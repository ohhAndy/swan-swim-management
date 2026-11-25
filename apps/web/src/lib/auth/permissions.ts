import type { StaffRole } from "@prisma/client";
export type { StaffRole };

const ROLE_HIERARCHY: Record<StaffRole, number> = {
  viewer: 1,
  instructor: 2,
  supervisor: 3,
  manager: 4,
  admin: 5,
  super_admin: 6,
};

export function hasMinRole(
  currentRole: StaffRole | undefined | null,
  requiredRole: StaffRole,
): boolean {
  if (!currentRole) return false;
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}
