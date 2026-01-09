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
exports.ClassInstructorsController = void 0;
const common_1 = require("@nestjs/common");
const class_instructors_service_1 = require("./class-instructors.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let ClassInstructorsController = class ClassInstructorsController {
    constructor(service) {
        this.service = service;
    }
    async assignInstructor(body, staffUser) {
        return this.service.assignInstructor(body.classOfferingId, body.instructorId, staffUser);
    }
    async removeInstructor(id, staffUser) {
        return this.service.removeInstructor(id, staffUser);
    }
    async getActiveInstructors(classOfferingId) {
        return this.service.getActiveInstructorsForClass(classOfferingId);
    }
    async getInstructorHistory(classOfferingId) {
        return this.service.getInstructorHistory(classOfferingId);
    }
    async getClassesForInstructor(instructorId) {
        return this.service.getClassesForInstructor(instructorId, true);
    }
};
exports.ClassInstructorsController = ClassInstructorsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("admin", "manager", "supervisor"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ClassInstructorsController.prototype, "assignInstructor", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("admin", "manager", "supervisor"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClassInstructorsController.prototype, "removeInstructor", null);
__decorate([
    (0, common_1.Get)("class/:classOfferingId"),
    (0, roles_decorator_1.Roles)("admin", "manager", "supervisor", "viewer"),
    __param(0, (0, common_1.Param)("classOfferingId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassInstructorsController.prototype, "getActiveInstructors", null);
__decorate([
    (0, common_1.Get)("class/:classOfferingId/history"),
    __param(0, (0, common_1.Param)("classOfferingId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassInstructorsController.prototype, "getInstructorHistory", null);
__decorate([
    (0, common_1.Get)("instructor/:instructorId"),
    __param(0, (0, common_1.Param)("instructorId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClassInstructorsController.prototype, "getClassesForInstructor", null);
exports.ClassInstructorsController = ClassInstructorsController = __decorate([
    (0, common_1.Controller)("class-instructors"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [class_instructors_service_1.ClassInstructorsService])
], ClassInstructorsController);
