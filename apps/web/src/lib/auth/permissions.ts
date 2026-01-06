export type StaffRole = "admin" | "manager" | "supervisor" | "viewer";

// Permission checking functions
export function canViewStudents(): boolean {
  return true; // All roles can view
}

export function canEditStudents(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canCreateStudents(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canDeleteStudents(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canEnrollStudents(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canTransferEnrollments(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canScheduleMakeups(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canMarkAttendance(role: StaffRole): boolean {
  return role === "admin" || role === "manager" || role === "supervisor";
}

export function canManageTerms(role: StaffRole): boolean {
  return role === "admin";
}

export function canViewInvoices(role: StaffRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageInvoices(role: StaffRole): boolean {
  return role === "admin";
}

export function canManageStaff(role: StaffRole): boolean {
  return role === "admin";
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
    | "manageStaff"
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
