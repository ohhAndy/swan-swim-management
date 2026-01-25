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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const nestjs_zod_1 = require("nestjs-zod");
const attendance_dto_1 = require("./dto/attendance.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async upsert(body, user) {
        return this.attendanceService.upsert(body, user);
    }
    async updateMakeUp(body, user) {
        return this.attendanceService.updateMakeup(body, user);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Put)(),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager", "supervisor"),
    __param(0, (0, common_1.Body)(new nestjs_zod_1.ZodValidationPipe(attendance_dto_1.UpsertAttendanceSchema))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "upsert", null);
__decorate([
    (0, common_1.Patch)("makeup"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager", "supervisor"),
    __param(0, (0, common_1.Body)(new nestjs_zod_1.ZodValidationPipe(attendance_dto_1.UpdateMakeupAttendanceSchema))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "updateMakeUp", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)("attendance"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
