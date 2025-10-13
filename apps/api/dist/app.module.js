"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const terms_module_1 = require("./terms/terms.module");
const sessions_module_1 = require("./sessions/sessions.module");
const enrollment_module_1 = require("./enrollments/enrollment.module");
const makeups_module_1 = require("./makeups/makeups.module");
const students_module_1 = require("./students/students.module");
const guardians_module_1 = require("./guardians/guardians.module");
const skips_module_1 = require("./enrollments/skips.module");
const attendance_module_1 = require("./attendance/attendance.module");
const offerings_module_1 = require("./offerings/offerings.module");
const staff_user_module_1 = require("./staff-users/staff-user.module");
const auth_module_1 = require("./auth/auth.module");
const config_1 = require("@nestjs/config");
const class_instructors_module_1 = require("./class-instructor/class-instructors.module");
const trial_bookings_module_1 = require("./trial-bookings/trial-bookings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true, // ensures env vars are accessible anywhere
                envFilePath: ['.env', 'apps/api/.env'], // support multiple fallback paths
            }),
            prisma_module_1.PrismaModule,
            terms_module_1.TermsModule,
            sessions_module_1.SessionsModule,
            enrollment_module_1.EnrollmentsModule,
            makeups_module_1.MakeupsModule,
            students_module_1.StudentsModule,
            guardians_module_1.GuardiansModule,
            skips_module_1.SkipsModule,
            attendance_module_1.AttendanceModule,
            offerings_module_1.OfferingsModule,
            staff_user_module_1.StaffUsersModule,
            auth_module_1.AuthModule,
            class_instructors_module_1.ClassInstructorsModule,
            trial_bookings_module_1.TrialBookingsModule,
        ],
    })
], AppModule);
