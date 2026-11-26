import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { RequestStaffUser } from "./auth.types";
import { hasMinRole } from "./roles";
import {
  canAccessLocation,
  LocationScope,
  SCOPED_TO_KEY,
  ScopeCheck,
  ScopedEntity,
} from "./location-scope";

interface ScopedRequest {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  staffUser?: RequestStaffUser;
  locationScope?: LocationScope;
}

const HEADER = "x-location-id";

@Injectable()
export class LocationScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const staffUser = request.staffUser;
    if (!staffUser) return true;

    const scope = await this.resolveScope(staffUser, request.headers[HEADER]);
    request.locationScope = scope;

    const checks = this.reflector.getAllAndOverride<ScopeCheck[] | undefined>(
      SCOPED_TO_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (checks?.length && scope.accessibleIds !== null) {
      for (const check of checks) {
        const ids = this.idsFor(check, request);
        if (ids.length === 0) continue;
        const locationIds = await this.locationsOf(check.entity, ids);
        if (locationIds.some((id) => !canAccessLocation(scope, id))) {
          throw new ForbiddenException("You do not have access to this location.");
        }
      }
    }

    return true;
  }

  private async resolveScope(
    staffUser: RequestStaffUser,
    header: string | string[] | undefined,
  ): Promise<LocationScope> {
    if (Array.isArray(header)) {
      throw new BadRequestException(`Send a single ${HEADER} header.`);
    }
    const isAdmin = hasMinRole(staffUser.role, "admin");
    const accessible = staffUser.accessibleLocations ?? [];
    const accessibleIds = isAdmin ? null : accessible.map((l) => l.id);
    const value = header?.trim();

    if (!value || value === "all") {
      return { locationId: null, accessibleIds };
    }

    if (isAdmin) {
      const location = await this.prisma.location.findFirst({
        where: { OR: [{ id: value }, { slug: value }] },
        select: { id: true },
      });
      if (!location) {
        throw new BadRequestException(`Unknown location "${value}".`);
      }
      return { locationId: location.id, accessibleIds };
    }

    const location = accessible.find((l) => l.id === value || l.slug === value);
    if (!location) {
      throw new ForbiddenException("You do not have access to this location.");
    }
    return { locationId: location.id, accessibleIds };
  }

  private idsFor(check: ScopeCheck, request: ScopedRequest): string[] {
    const source =
      check.from === "param"
        ? request.params
        : check.from === "query"
          ? request.query
          : request.body;
    if (!source || typeof source !== "object") return [];
    const value = (source as Record<string, unknown>)[check.key];

    if (check.each) {
      if (!Array.isArray(value)) return [];
      return value
        .map((item: unknown) =>
          item && typeof item === "object"
            ? (item as Record<string, unknown>)[check.each!]
            : undefined,
        )
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    }

    return typeof value === "string" && value.length > 0 ? [value] : [];
  }

  private async locationsOf(
    entity: ScopedEntity,
    ids: string[],
  ): Promise<string[]> {
    const where = { id: { in: [...new Set(ids)] } };
    const viaTerm = { select: { locationId: true } } as const;
    const viaOffering = { select: { term: viaTerm } } as const;
    const viaSession = { select: { offering: viaOffering } } as const;

    switch (entity) {
      case "term":
        return (
          await this.prisma.term.findMany({ where, select: { locationId: true } })
        ).map((r) => r.locationId);
      case "offering":
        return (
          await this.prisma.classOffering.findMany({ where, select: { term: viaTerm } })
        ).map((r) => r.term.locationId);
      case "session":
        return (
          await this.prisma.classSession.findMany({ where, select: { offering: viaOffering } })
        ).map((r) => r.offering.term.locationId);
      case "enrollment":
        return (
          await this.prisma.enrollment.findMany({ where, select: { offering: viaOffering } })
        ).map((r) => r.offering.term.locationId);
      case "classInstructor":
        return (
          await this.prisma.classInstructor.findMany({
            where,
            select: { classOffering: viaOffering },
          })
        ).map((r) => r.classOffering.term.locationId);
      case "trialBooking":
        return (
          await this.prisma.trialBooking.findMany({ where, select: { classSession: viaSession } })
        ).map((r) => r.classSession.offering.term.locationId);
      case "makeUp":
        return (
          await this.prisma.makeUpBooking.findMany({ where, select: { classSession: viaSession } })
        ).map((r) => r.classSession.offering.term.locationId);
      case "swimTeamRegistration":
        return (
          await this.prisma.swimTeamRegistration.findMany({ where, select: { term: viaTerm } })
        ).map((r) => r.term.locationId);
    }
  }
}
