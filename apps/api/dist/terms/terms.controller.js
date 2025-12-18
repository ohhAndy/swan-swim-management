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
exports.TermsController = void 0;
const common_1 = require("@nestjs/common");
const terms_service_1 = require("./terms.service");
const create_term_dto_1 = require("./dto/create-term.dto");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let TermsController = class TermsController {
    constructor(termsService) {
        this.termsService = termsService;
    }
    async create(body, user) {
        const input = create_term_dto_1.CreateTermSchema.parse(body);
        return await this.termsService.createTermWithSchedule(input, user);
    }
    async getAllTerms() {
        return this.termsService.getAllTerms();
    }
    async getTermTitle(termId) {
        return this.termsService.getTermTitle(termId);
    }
    async getTimeSlotsForWeekday(termId, weekday) {
        return this.termsService.getSlotsForWeekday(termId, Number(weekday));
    }
    async getDefaultTimeSlots(termId) {
        return this.termsService.getDefaultSlots(termId);
    }
    async getSlotPage(termId, weekday, start, end) {
        return this.termsService.slotByWeekdayAndTime(weekday, termId, start, end);
    }
    async getDailySchedule(termId, date) {
        return this.termsService.getDailySchedule(termId, date);
    }
};
exports.TermsController = TermsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("admin"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getAllTerms", null);
__decorate([
    (0, common_1.Get)(":termId"),
    __param(0, (0, common_1.Param)("termId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getTermTitle", null);
__decorate([
    (0, common_1.Get)(":termId/schedule/weekday/:weekday/slots"),
    __param(0, (0, common_1.Param)("termId")),
    __param(1, (0, common_1.Param)("weekday")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getTimeSlotsForWeekday", null);
__decorate([
    (0, common_1.Get)(":termId/schedule/weekday/:weekday/slots-default"),
    __param(0, (0, common_1.Param)("termId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getDefaultTimeSlots", null);
__decorate([
    (0, common_1.Get)(":termId/schedule/weekday/:weekday/slot/:start/:end"),
    __param(0, (0, common_1.Param)("termId")),
    __param(1, (0, common_1.Param)("weekday", common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)("start")),
    __param(3, (0, common_1.Param)("end")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getSlotPage", null);
__decorate([
    (0, common_1.Get)(":termId/schedule/date/:date"),
    __param(0, (0, common_1.Param)("termId")),
    __param(1, (0, common_1.Param)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TermsController.prototype, "getDailySchedule", null);
exports.TermsController = TermsController = __decorate([
    (0, common_1.Controller)("terms"),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [terms_service_1.TermsService])
], TermsController);
