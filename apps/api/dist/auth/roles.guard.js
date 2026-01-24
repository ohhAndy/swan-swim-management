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
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        // If no roles specified, allow access (auth only required)
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Set by SupabaseAuthGuard
        if (!user || !user.authId) {
            throw new common_1.ForbiddenException("User not authenticated");
        }
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
                    throw new common_1.ForbiddenException(`Access denied. You are not scheduled to work at this time (${dayName} ${timeString}).`);
                }
            }
            else if (schedule[dayName] === undefined &&
                Object.keys(schedule).length > 0) {
                // If schedule exists but no rules for today?
                // Usually implies denied if schedule is present.
                // Assuming strict: if I have a schedule for Friday but today is Monday, and Monday is missing, is it allowed?
                // User request: "certain time frames like friday... and saturday..." implies ONLY those times.
                // So if today is not in schedule, DENY.
                // We check if schedule has ANY keys (meaning restricted mode is active).
                // If so, and today is missing or empty, deny.
                throw new common_1.ForbiddenException(`Access denied. No schedule found for today (${dayName}).`);
            }
        }
        // Check if user has required role
        if (!requiredRoles.includes(staffUser.role)) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(" or ")}`);
        }
        // Attach full staff user info to request
        request.staffUser = staffUser;
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], RolesGuard);
