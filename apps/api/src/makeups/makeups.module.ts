import { Module } from "@nestjs/common";
import { MakeupsService } from "./makeups.service";
import { MakeupsController } from "./makeups.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
    controllers: [MakeupsController],
    providers: [MakeupsService, PrismaService],
})
export class MakeupsModule {}