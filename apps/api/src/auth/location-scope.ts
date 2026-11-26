import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  SetMetadata,
} from "@nestjs/common";

export interface LocationScope {
  /** null: every location the user may access */
  locationId: string | null;
  /** null: every location (admins) */
  accessibleIds: string[] | null;
}

export const CurrentLocationScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LocationScope => {
    const scope = ctx.switchToHttp().getRequest().locationScope as
      | LocationScope
      | undefined;
    if (!scope) {
      throw new InternalServerErrorException(
        "Location scope is not available on this route",
      );
    }
    return scope;
  },
);

export function scopeFilter(
  scope: LocationScope,
): string | { in: string[] } | undefined {
  if (scope.locationId) return scope.locationId;
  return accessibleFilter(scope);
}

/** Ignores the selected location. */
export function accessibleFilter(
  scope: LocationScope,
): { in: string[] } | undefined {
  return scope.accessibleIds ? { in: scope.accessibleIds } : undefined;
}

export function canAccessLocation(
  scope: LocationScope,
  locationId: string,
): boolean {
  return scope.accessibleIds === null || scope.accessibleIds.includes(locationId);
}

export function assertCanAccessLocation(
  scope: LocationScope,
  locationId: string,
): void {
  if (!canAccessLocation(scope, locationId)) {
    throw new ForbiddenException("You do not have access to this location.");
  }
}

export function requireSingleLocation(scope: LocationScope): string {
  if (scope.locationId) return scope.locationId;
  if (scope.accessibleIds?.length === 1) return scope.accessibleIds[0];
  throw new BadRequestException("Select a location first.");
}

export type ScopedEntity =
  | "term"
  | "offering"
  | "session"
  | "enrollment"
  | "invoice"
  | "payment"
  | "trialBooking"
  | "makeUp"
  | "classInstructor"
  | "swimTeamRegistration";

export interface ScopeCheck {
  entity: ScopedEntity;
  from: "param" | "body" | "query";
  key: string;
  each?: string;
}

export const SCOPED_TO_KEY = "scopedTo";

/** 403 unless the user may access every named record's location. Missing records are left to the handler. */
export const ScopedTo = (...checks: ScopeCheck[]) =>
  SetMetadata(SCOPED_TO_KEY, checks);

export const fromParam = (entity: ScopedEntity, key: string): ScopeCheck => ({
  entity,
  from: "param",
  key,
});

/** Only for required fields: a missing id skips the check. */
export const fromBody = (entity: ScopedEntity, key: string): ScopeCheck => ({
  entity,
  from: "body",
  key,
});

export const fromQuery = (entity: ScopedEntity, key: string): ScopeCheck => ({
  entity,
  from: "query",
  key,
});

export const fromBodyList = (
  entity: ScopedEntity,
  key: string,
  each: string,
): ScopeCheck => ({ entity, from: "body", key, each });
