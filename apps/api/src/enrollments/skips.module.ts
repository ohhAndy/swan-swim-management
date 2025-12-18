import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkipsService } from "./skips.service";
import { SkipsController } from "./skips.controller";

@Module({
    controllers: [SkipsController],
    providers: [SkipsService, PrismaService],
    exports: [SkipsService],
})
export class SkipsModule {}