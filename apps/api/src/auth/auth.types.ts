import { Prisma } from "@prisma/client";

/**
 * Represents the authenticated user extracted from the JWT token.
 * Set by SupabaseAuthGuard on request.user.
 */
export interface AuthenticatedUser {
  authId: string;
  email: string;
}

export interface RequestStaffUser {
  id: string;
  authId: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  accessSchedule: Prisma.JsonValue;
  accessibleLocations?: { id: string }[];
}

/**
 * Represents the staff user with location access info.
 * Used when the service needs to check location-scoped access.
 */
export type StaffUserWithLocations = RequestStaffUser;

