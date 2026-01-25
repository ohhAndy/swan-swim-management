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
exports.MakeupsController = void 0;
const common_1 = require("@nestjs/common");
const makeups_service_1 = require("./makeups.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let MakeupsController = class MakeupsController {
    constructor(makeupsService) {
        this.makeupsService = makeupsService;
    }
    async create(body, user) {
        return this.makeupsService.scheduleMakeUp(body, user);
    }
};
exports.MakeupsController = MakeupsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("super_admin", "admin", "manager"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MakeupsController.prototype, "create", null);
exports.MakeupsController = MakeupsController = __decorate([
    (0, common_1.Controller)("makeups"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [makeups_service_1.MakeupsService])
], MakeupsController);
