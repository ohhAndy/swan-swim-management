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
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

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
      [context.getHandler(), context.getClass()]
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
      select: { role: true, active: true },
    });

    if (!staffUser || !staffUser.active) {
      throw new ForbiddenException("User not found or inactive");
    }

    // Check if user has required role
    if (!requiredRoles.includes(staffUser.role as StaffRole)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(" or ")}`
      );
    }

    // Attach full staff user info to request
    request.staffUser = staffUser;
    return true;
  }
}
