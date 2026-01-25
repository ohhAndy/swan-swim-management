"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const public_decorator_1 = require("./public.decorator");
let RolesGuard = class RolesGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
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
            const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
            if (requiredRoles) {
                throw new common_1.ForbiddenException("User not authenticated");
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
            throw new common_1.ForbiddenException("User not found or inactive");
        }
        // Check allowed login times
        if (staffUser.accessSchedule) {
            const schedule = staffUser.accessSchedule;
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
            // console.log("Access Check Debug:", { dayName, timeString, schedule });
            const dayRules = schedule[dayName];
            if (dayRules && dayRules.length > 0) {
                const isAllowed = dayRules.some((rule) => {
                    return timeString >= rule.start && timeString <= rule.end;
                });
                if (!isAllowed) {
                    throw new common_1.ForbiddenException(`Access denied. You are not scheduled to work at this time (${dayName} ${timeString}).`);
                }
            }
            else if (schedule[dayName] === undefined &&
                Object.keys(schedule).length > 0) {
                // console.log("Access Denied: No rules for today", dayName);
                throw new common_1.ForbiddenException(`Access denied. No schedule found for today (${dayName}).`);
            }
        }
        // Attach full staff user info to request
        request.staffUser = staffUser;
        // Finally, check Roles if they were required
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (requiredRoles && !requiredRoles.includes(staffUser.role)) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(" or ")}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], RolesGuard);
