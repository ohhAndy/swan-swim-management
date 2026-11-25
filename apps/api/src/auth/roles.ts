import type { StaffRole } from "@prisma/client";

// Each role can do everything the roles below it can.
// Keep in step with apps/web/src/lib/auth/permissions.ts.
const ROLE_RANK: Record<StaffRole, number> = {
  supervisor: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

export function hasMinRole(
  role: string | null | undefined,
  minRole: StaffRole,
): boolean {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_RANK, role)) {
    return false;
  }
  return ROLE_RANK[role as StaffRole] >= ROLE_RANK[minRole];
}
