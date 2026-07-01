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
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("report-cards")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("super_admin", "admin", "manager", "supervisor")
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post()
  create(
    @Body() createReportCardDto: CreateReportCardDto,
    @CurrentUser() user: any,
  ) {
    return this.reportCardsService.create(createReportCardDto, user);
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
    @CurrentUser() user: any,
  ) {
    return this.reportCardsService.update(id, updateReportCardDto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reportCardsService.remove(id);
  }
}
