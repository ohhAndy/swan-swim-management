import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { StaffUserWithLocations } from "../../auth/auth.types";
import { hasMinRole } from "../../auth/roles";

export function validateLocationAccess(
  staffUser: StaffUserWithLocations,
  locationId?: string,
): string | null {
  // 1. Admin Bypass
  if (hasMinRole(staffUser.role, "admin")) {
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
    (l) => l.id === locationId,
  );

  if (!hasAccess) {
    throw new ForbiddenException("You do not have access to this location.");
  }

  return locationId;
}
