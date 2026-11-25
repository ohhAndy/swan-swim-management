import type { StaffRole } from "@prisma/client";
export type { StaffRole };

const ROLE_HIERARCHY: Record<StaffRole, number> = {
  supervisor: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

export function hasMinRole(
  currentRole: StaffRole | undefined | null,
  requiredRole: StaffRole,
): boolean {
  if (!currentRole) return false;
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}
