import { Prisma } from "@prisma/client";

/**
 * Represents the authenticated user extracted from the JWT token.
 * Set by SupabaseAuthGuard on request.user.
 */
export interface AuthenticatedUser {
  authId: string;
  email: string;
}

/**
 * Represents the staff user info attached by RolesGuard.
 * Set on request.staffUser after DB lookup.
 */
export interface RequestStaffUser {
  role: string;
  active: boolean;
  accessSchedule: Prisma.JsonValue;
}

/**
 * Represents the staff user with location access info.
 * Used when the service needs to check location-scoped access.
 */
export interface StaffUserWithLocations extends RequestStaffUser {
  id: string;
  accessibleLocations?: { id: string }[];
}
