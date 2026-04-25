import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ReportCardsService } from "./report-cards.service";
import { CreateReportCardDto } from "./dto/create-report-card.dto";
import { UpdateReportCardDto } from "./dto/update-report-card.dto";

@Controller("report-cards")
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post()
  create(@Body() createReportCardDto: CreateReportCardDto) {
    return this.reportCardsService.create(createReportCardDto);
  }

  @Get()
  findAll() {
    return this.reportCardsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reportCardsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateReportCardDto: UpdateReportCardDto,
  ) {
    return this.reportCardsService.update(id, updateReportCardDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reportCardsService.remove(id);
  }

  @Post(":id/email")
  email(@Param("id") id: string, @Body() body: { pdfContent: string }) {
    return this.reportCardsService.emailReportCard(id, body.pdfContent);
  }
}
