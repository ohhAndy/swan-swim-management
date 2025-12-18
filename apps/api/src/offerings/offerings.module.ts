import { Module } from "@nestjs/common";
import { OfferingsService } from "./offerings.service";
import { OfferingsController } from "./offerings.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
    controllers: [OfferingsController],
    providers: [OfferingsService, PrismaService],
})
export class OfferingsModule {}