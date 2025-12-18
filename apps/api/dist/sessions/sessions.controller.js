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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async seatsForSlot(termId, weekday, startTime, dateOnly) {
        return this.sessionsService.seatsForSlot({
            termId,
            weekday: Number(weekday),
            startTime,
            dateOnly,
        });
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)("slot"),
    __param(0, (0, common_1.Query)("termId")),
    __param(1, (0, common_1.Query)("weekday")),
    __param(2, (0, common_1.Query)("startTime")),
    __param(3, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "seatsForSlot", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)("sessions"),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
