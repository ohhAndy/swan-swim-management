"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeupsModule = void 0;
const common_1 = require("@nestjs/common");
const makeups_service_1 = require("./makeups.service");
const makeups_controller_1 = require("./makeups.controller");
const prisma_service_1 = require("../prisma/prisma.service");
let MakeupsModule = class MakeupsModule {
};
exports.MakeupsModule = MakeupsModule;
exports.MakeupsModule = MakeupsModule = __decorate([
    (0, common_1.Module)({
        controllers: [makeups_controller_1.MakeupsController],
        providers: [makeups_service_1.MakeupsService, prisma_service_1.PrismaService],
    })
], MakeupsModule);
