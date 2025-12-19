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
exports.OfferingsController = void 0;
const common_1 = require("@nestjs/common");
const offerings_service_1 = require("./offerings.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let OfferingsController = class OfferingsController {
    constructor(offeringsService) {
        this.offeringsService = offeringsService;
    }
    async getAvailableForTransfer(termId, excludeOfferingId, level) {
        return this.offeringsService.getOfferingsForTransfer(termId, excludeOfferingId, level);
    }
    async updateOfferingInfo(offeringId, body, user) {
        return this.offeringsService.updateOfferingInfo(offeringId, body, user);
    }
    async createOffering(body, user) {
        return this.offeringsService.createOffering(body, user);
    }
    async deleteOffering(offeringId, user) {
        return this.offeringsService.deleteOffering(offeringId, user);
    }
};
exports.OfferingsController = OfferingsController;
__decorate([
    (0, common_1.Get)("available-for-transfer"),
    __param(0, (0, common_1.Query)("termId")),
    __param(1, (0, common_1.Query)("excludeOfferingId")),
    __param(2, (0, common_1.Query)("level")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OfferingsController.prototype, "getAvailableForTransfer", null);
__decorate([
    (0, common_1.Patch)(":offeringId"),
    (0, roles_decorator_1.Roles)("admin", "manager", "supervisor"),
    __param(0, (0, common_1.Param)("offeringId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OfferingsController.prototype, "updateOfferingInfo", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("admin", "manager"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OfferingsController.prototype, "createOffering", null);
__decorate([
    (0, common_1.Delete)(":offeringId"),
    (0, roles_decorator_1.Roles)("admin", "manager"),
    __param(0, (0, common_1.Param)("offeringId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OfferingsController.prototype, "deleteOffering", null);
exports.OfferingsController = OfferingsController = __decorate([
    (0, common_1.Controller)("offerings"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [offerings_service_1.OfferingsService])
], OfferingsController);
