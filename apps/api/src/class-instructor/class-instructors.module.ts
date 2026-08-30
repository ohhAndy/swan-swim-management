import { Module } from '@nestjs/common';
import { ClassInstructorsController } from './class-instructors.controller';
import { ClassInstructorsService } from './class-instructors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [ClassInstructorsController],
  providers: [ClassInstructorsService],
  exports: [ClassInstructorsService],
})
export class ClassInstructorsModule {}