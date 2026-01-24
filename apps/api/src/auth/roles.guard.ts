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

    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access (auth only required)
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by SupabaseAuthGuard

    if (!user || !user.authId) {
      throw new ForbiddenException("User not authenticated");
    }

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
        timeZone: "America/Toronto", // Swan Swim is likely in Toronto/ET based on context or default to server
      });
      // Get current time in HH:mm format
      // utilizing toLocaleString to ensure correct timezone handling matches dayName
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Toronto",
      });

      const dayRules = schedule[dayName];

      if (dayRules && dayRules.length > 0) {
        // Check if current time is within any of the allowed ranges
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
        // If schedule exists but no rules for today?
        // Usually implies denied if schedule is present.
        // Assuming strict: if I have a schedule for Friday but today is Monday, and Monday is missing, is it allowed?
        // User request: "certain time frames like friday... and saturday..." implies ONLY those times.
        // So if today is not in schedule, DENY.

        // We check if schedule has ANY keys (meaning restricted mode is active).
        // If so, and today is missing or empty, deny.
        throw new ForbiddenException(
          `Access denied. No schedule found for today (${dayName}).`,
        );
      }
    }

    // Check if user has required role
    if (!requiredRoles.includes(staffUser.role as StaffRole)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(" or ")}`,
      );
    }

    // Attach full staff user info to request
    request.staffUser = staffUser;
    return true;
  }
}
