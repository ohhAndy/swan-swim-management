import { ForbiddenException, BadRequestException } from "@nestjs/common";

export function validateLocationAccess(
  staffUser: any, // Typed as any to match current usage, refine if StaffUser type available
  locationId?: string,
): string | null {
  // 1. Admin Bypass
  if (staffUser.role === "admin" || staffUser.role === "super_admin") {
    return locationId ?? null;
  }

  // 2. No Location Provided
  if (!locationId) {
    if (staffUser.accessibleLocations?.length === 1) {
      return staffUser.accessibleLocations[0].id; // Auto-infer
    }
    throw new BadRequestException("Location ID is required.");
  }

  // 3. Validate Access
  const hasAccess = staffUser.accessibleLocations?.some(
    (l: any) => l.id === locationId,
  );

  if (!hasAccess) {
    throw new ForbiddenException("You do not have access to this location.");
  }

  return locationId;
}
