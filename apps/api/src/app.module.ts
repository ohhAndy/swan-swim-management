import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { TermsModule } from "./terms/terms.module";
import { SessionsModule } from "./sessions/sessions.module";
import { EnrollmentsModule } from "./enrollments/enrollment.module";
import { MakeupsModule } from "./makeups/makeups.module";
import { StudentsModule } from "./students/students.module";
import { GuardiansModule } from "./guardians/guardians.module";
import { SkipsModule } from "./enrollments/skips.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { OfferingsModule } from "./offerings/offerings.module";
import { StaffUsersModule } from "./staff-users/staff-user.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ClassInstructorsModule } from "./class-instructor/class-instructors.module";
import { InstructorsModule } from "./instructor/instructor.module";
import { TrialBookingsModule } from "./trial-bookings/trial-bookings.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentsModule } from "./payments/payments.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { ExportsModule } from "./exports/exports.module";
import { LocationsModule } from "./locations/locations.module";
import { TasksModule } from "./tasks/tasks.module";
import { HealthModule } from "./health/health.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { InventoryModule } from "./inventory/inventory.module";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { SupabaseAuthGuard } from "./auth/supabase-auth.guard";
import { RolesGuard } from "./auth/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ensures env vars are accessible anywhere
      envFilePath: [".env", "apps/api/.env"], // support multiple fallback paths
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    TermsModule,
    SessionsModule,
    EnrollmentsModule,
    MakeupsModule,
    StudentsModule,
    GuardiansModule,
    SkipsModule,
    AttendanceModule,
    OfferingsModule,
    StaffUsersModule,
    AuthModule,
    InstructorsModule,
    ClassInstructorsModule,
    TrialBookingsModule,
    InvoicesModule,
    PaymentsModule,
    StatisticsModule,
    ExportsModule,
    LocationsModule,
    StatisticsModule,
    ExportsModule,
    LocationsModule,
    TasksModule,
    HealthModule,
    AuditLogsModule,
    InventoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
