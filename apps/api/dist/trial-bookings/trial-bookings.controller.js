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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialBookingsController = void 0;
// apps/api/src/trial-bookings/trial-bookings.controller.ts
const common_1 = require("@nestjs/common");
const trial_bookings_service_1 = require("./trial-bookings.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let TrialBookingsController = class TrialBookingsController {
    constructor(service) {
        this.service = service;
    }
    async getUpcoming() {
        return this.service.findUpcoming();
    }
    async getPast() {
        return this.service.findPast();
    }
    async getStats() {
        return this.service.getStats();
    }
    async createTrialBooking(body, staffUser) {
        return this.service.createTrialBooking(body.classSessionId, body.childName, body.childAge, body.parentPhone, body.notes || null, staffUser);
    }
    async updateStatus(id, body, staffUser) {
        return this.service.updateTrialStatus(id, body.status, staffUser);
    }
    async convertToStudent(id, body, staffUser) {
        return this.service.convertToStudent(id, body.studentId, staffUser);
    }
    async deleteTrialBooking(id, staffUser) {
        return this.service.deleteTrialBooking(id, staffUser);
    }
};
exports.TrialBookingsController = TrialBookingsController;
__decorate([
    (0, common_1.Get)("upcoming"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager", "supervisor"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)("past"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager", "supervisor"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "getPast", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "createTrialBooking", null);
__decorate([
    (0, common_1.Patch)(":id/status"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager", "supervisor"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(":id/convert"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "convertToStudent", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrialBookingsController.prototype, "deleteTrialBooking", null);
exports.TrialBookingsController = TrialBookingsController = __decorate([
    (0, common_1.Controller)("trial-bookings"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [trial_bookings_service_1.TrialBookingsService])
], TrialBookingsController);
