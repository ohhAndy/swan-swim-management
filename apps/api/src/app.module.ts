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
import { TrialBookingsModule } from "./trial-bookings/trial-bookings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ensures env vars are accessible anywhere
      envFilePath: ['.env', 'apps/api/.env'], // support multiple fallback paths
    }),
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
    ClassInstructorsModule,
    TrialBookingsModule,
  ],
})
export class AppModule {}
