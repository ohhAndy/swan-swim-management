import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, StaffRole } from "./roles.decorator";
import { PrismaService } from "../prisma/prisma.service";

import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by SupabaseAuthGuard

    // If user is not authenticated...
    if (!user || !user.authId) {
      // Check if roles were strictly required
      const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles) {
        throw new ForbiddenException("User not authenticated");
      }
      // If no roles required and no user, allow (optional auth route)
      return true;
    }

    // --- User is Authenticated ---

    // Fetch staff user from database
    const staffUser = await this.prisma.staffUser.findUnique({
      where: { authId: user.authId },
      select: { role: true, active: true, accessSchedule: true },
    });

    if (!staffUser || !staffUser.active) {
      throw new ForbiddenException("User not found or inactive");
    }

    // Check allowed login times
    if (staffUser.accessSchedule) {
      const schedule = staffUser.accessSchedule as Record<
        string,
        { start: string; end: string }[]
      >;
      const now = new Date();
      // Get day name (e.g. "Friday")
      const dayName = now.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "America/Toronto",
      });
      // Get current time in HH:mm format
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Toronto",
      });

      const dayRules = schedule[dayName];

      if (dayRules && dayRules.length > 0) {
        const isAllowed = dayRules.some((rule) => {
          return timeString >= rule.start && timeString <= rule.end;
        });

        if (!isAllowed) {
          throw new ForbiddenException(
            `Access denied. You are not scheduled to work at this time (${dayName} ${timeString}).`,
          );
        }
      } else if (
        schedule[dayName] === undefined &&
        Object.keys(schedule).length > 0
      ) {
        throw new ForbiddenException(
          `Access denied. No schedule found for today (${dayName}).`,
        );
      }
    }

    // Attach full staff user info to request
    request.staffUser = staffUser;

    // Finally, check Roles if they were required
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && !requiredRoles.includes(staffUser.role as StaffRole)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(" or ")}`,
      );
    }

    return true;
  }
}
