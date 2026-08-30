import { Module } from '@nestjs/common';
import { TrialBookingsController } from './trial-bookings.controller';
import { TrialBookingsService } from './trial-bookings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [TrialBookingsController],
  providers: [TrialBookingsService],
  exports: [TrialBookingsService],
})
export class TrialBookingsModule {}
