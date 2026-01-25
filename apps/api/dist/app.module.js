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
const instructor_module_1 = require("./instructor/instructor.module");
const trial_bookings_module_1 = require("./trial-bookings/trial-bookings.module");
const invoices_module_1 = require("./invoices/invoices.module");
const payments_module_1 = require("./payments/payments.module");
const statistics_module_1 = require("./statistics/statistics.module");
const exports_module_1 = require("./exports/exports.module");
const locations_module_1 = require("./locations/locations.module");
const tasks_module_1 = require("./tasks/tasks.module");
const health_module_1 = require("./health/health.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const supabase_auth_guard_1 = require("./auth/supabase-auth.guard");
const roles_guard_1 = require("./auth/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true, // ensures env vars are accessible anywhere
                envFilePath: [".env", "apps/api/.env"], // support multiple fallback paths
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
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
            instructor_module_1.InstructorsModule,
            class_instructors_module_1.ClassInstructorsModule,
            trial_bookings_module_1.TrialBookingsModule,
            invoices_module_1.InvoicesModule,
            payments_module_1.PaymentsModule,
            statistics_module_1.StatisticsModule,
            exports_module_1.ExportsModule,
            locations_module_1.LocationsModule,
            statistics_module_1.StatisticsModule,
            exports_module_1.ExportsModule,
            locations_module_1.LocationsModule,
            tasks_module_1.TasksModule,
            health_module_1.HealthModule,
            audit_logs_module_1.AuditLogsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: supabase_auth_guard_1.SupabaseAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
