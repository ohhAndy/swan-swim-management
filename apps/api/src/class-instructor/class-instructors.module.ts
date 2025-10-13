import { Module } from '@nestjs/common';
import { ClassInstructorsController } from './class-instructors.controller';
import { ClassInstructorsService } from './class-instructors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassInstructorsController],
  providers: [ClassInstructorsService],
  exports: [ClassInstructorsService],
})
export class ClassInstructorsModule {}