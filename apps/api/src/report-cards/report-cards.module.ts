import { Module } from "@nestjs/common";
import { ReportCardsService } from "./report-cards.service";
import { ReportCardsController } from "./report-cards.controller";

@Module({
  imports: [],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
})
export class ReportCardsModule {}
