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
exports.GuardiansController = void 0;
const common_1 = require("@nestjs/common");
const guardians_service_1 = require("./guardians.service");
const nestjs_zod_1 = require("nestjs-zod");
const schemas_dto_1 = require("./dto/schemas.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let GuardiansController = class GuardiansController {
    constructor(guardiansService) {
        this.guardiansService = guardiansService;
    }
    async searchOrList(query) {
        return this.guardiansService.searchOrList(query);
    }
    async getById(id) {
        return this.guardiansService.getById(id);
    }
    async create(body, user) {
        return this.guardiansService.create(body, user);
    }
    async update(id, body, user) {
        return this.guardiansService.update(id, body, user);
    }
    async delete(id, user) {
        return this.guardiansService.delete(id, user);
    }
};
exports.GuardiansController = GuardiansController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)(new nestjs_zod_1.ZodValidationPipe(schemas_dto_1.searchGuardianSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GuardiansController.prototype, "searchOrList", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GuardiansController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Body)(new nestjs_zod_1.ZodValidationPipe(schemas_dto_1.createGuardianSchema))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GuardiansController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)(new nestjs_zod_1.ZodValidationPipe(schemas_dto_1.updateGuardianSchema))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GuardiansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GuardiansController.prototype, "delete", null);
exports.GuardiansController = GuardiansController = __decorate([
    (0, common_1.Controller)("guardians"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [guardians_service_1.GuardiansService])
], GuardiansController);
