import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ReportCardsService } from "./report-cards.service";
import { CreateReportCardDto } from "./dto/create-report-card.dto";
import { UpdateReportCardDto } from "./dto/update-report-card.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("report-cards")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("super_admin", "admin", "manager", "supervisor")
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post()
  create(
    @Body() createReportCardDto: CreateReportCardDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.reportCardsService.create(createReportCardDto, staffUser);
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
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.reportCardsService.update(id, updateReportCardDto, staffUser);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.reportCardsService.remove(id, staffUser);
  }

  @Post(":id/email")
  email(
    @Param("id") id: string,
    @Body() body: { pdfContent: string },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.reportCardsService.emailReportCard(id, body.pdfContent, staffUser);
  }
}
