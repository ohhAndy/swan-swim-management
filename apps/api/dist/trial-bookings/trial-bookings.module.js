"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialBookingsModule = void 0;
// apps/api/src/trial-bookings/trial-bookings.module.ts
const common_1 = require("@nestjs/common");
const trial_bookings_controller_1 = require("./trial-bookings.controller");
const trial_bookings_service_1 = require("./trial-bookings.service");
const prisma_module_1 = require("../prisma/prisma.module");
let TrialBookingsModule = class TrialBookingsModule {
};
exports.TrialBookingsModule = TrialBookingsModule;
exports.TrialBookingsModule = TrialBookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [trial_bookings_controller_1.TrialBookingsController],
        providers: [trial_bookings_service_1.TrialBookingsService],
        exports: [trial_bookings_service_1.TrialBookingsService],
    })
], TrialBookingsModule);
