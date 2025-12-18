// apps/api/src/trial-bookings/trial-bookings.module.ts
import { Module } from '@nestjs/common';
import { TrialBookingsController } from './trial-bookings.controller';
import { TrialBookingsService } from './trial-bookings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrialBookingsController],
  providers: [TrialBookingsService],
  exports: [TrialBookingsService],
})
export class TrialBookingsModule {}
