import { Module } from "@nestjs/common";
import { ReportCardsService } from "./report-cards.service";
import { ReportCardsController } from "./report-cards.controller";
import { CommunicationsModule } from "../communications/communications.module";

@Module({
  imports: [CommunicationsModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
})
export class ReportCardsModule {}
