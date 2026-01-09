import { Module } from "@nestjs/common";
import { InstructorsService } from "./instructor.service";
import { InstructorsController } from "./instructor.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InstructorsController],
  providers: [InstructorsService],
  exports: [InstructorsService],
})
export class InstructorsModule {}
