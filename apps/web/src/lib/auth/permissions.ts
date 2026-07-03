import type { StaffRole } from "@prisma/client";
export type { StaffRole };

export const ROLE_HIERARCHY: Record<StaffRole, number> = {
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
  return (
    (ROLE_HIERARCHY[currentRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
  );
}

// Permission checking functions
export function canViewStudents(): boolean {
  return true; // All roles can view
}

export function canEditStudents(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canCreateStudents(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canDeleteStudents(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canEnrollStudents(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canTransferEnrollments(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canScheduleMakeups(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canMarkAttendance(role: StaffRole): boolean {
  return hasMinRole(role, "supervisor");
}

export function canManageTerms(role: StaffRole): boolean {
  return hasMinRole(role, "admin");
}

export function canViewInvoices(role: StaffRole): boolean {
  return hasMinRole(role, "manager");
}

export function canManageInvoices(role: StaffRole): boolean {
  return hasMinRole(role, "admin");
}

export function canManageStaff(role: StaffRole): boolean {
  return hasMinRole(role, "admin");
}

// Helper to check if user has permission
export function hasPermission(
  role: StaffRole,
  action:
    | "viewStudents"
    | "editStudents"
    | "createStudents"
    | "deleteStudents"
    | "enrollStudents"
    | "transferEnrollments"
    | "scheduleMakeups"
    | "markAttendance"
    | "manageTerms"
    | "viewInvoices"
    | "manageInvoices"
    | "manageStaff",
): boolean {
  const permissionMap = {
    viewStudents: canViewStudents,
    editStudents: canEditStudents,
    createStudents: canCreateStudents,
    deleteStudents: canDeleteStudents,
    enrollStudents: canEnrollStudents,
    transferEnrollments: canTransferEnrollments,
    scheduleMakeups: canScheduleMakeups,
    markAttendance: canMarkAttendance,
    manageTerms: canManageTerms,
    viewInvoices: canViewInvoices,
    manageInvoices: canManageInvoices,
    manageStaff: canManageStaff,
  };

  return permissionMap[action](role);
}
