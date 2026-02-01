import {
  Body,
  Controller,
  Post,
  Param,
  Put,
  UseGuards,
  Delete,
  Get,
  Query,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { UnInvoicedEnrollmentsQueryDto } from "../invoices/dto/uninvoiced-enrollments-query.dto";
import {
  EnrollWithSkipInput,
  EnrollWithSkipSchema,
} from "./dto/enrollment.dto";
import { ZodValidationPipe } from "nestjs-zod";
import {
  TransferEnrollmentDto,
  transferEnrollmentSchema,
} from "./dto/transfer.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("enrollments")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get("uninvoiced")
  @Roles("super_admin", "admin", "manager")
  async findUninvoiced(@Query() query: UnInvoicedEnrollmentsQueryDto) {
    return this.enrollmentsService.findUninvoiced(query);
  }

  @Post("with-skip")
  @Roles("super_admin", "admin", "manager")
  async enrollWithSkips(
    @Body(new ZodValidationPipe(EnrollWithSkipSchema))
    body: EnrollWithSkipInput,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.enrollWithSkips(body, user);
  }

  @Post(":id/transfer")
  @Roles("super_admin", "admin", "manager")
  async transferEnrollment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transferEnrollmentSchema))
    body: TransferEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.transferEnrollment(id, body, user);
  }

  @Put(":id/remarks")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateRemarks(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.updateRemarks(id, body, user);
  }

  @Put(":id/report-card-status")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateReportCardStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.updateReportCardStatus(
      id,
      body.status,
      user,
    );
  }

  @Put(":id/skips")
  @Roles("super_admin", "admin", "manager")
  async updateSkips(
    @Param("id") id: string,
    @Body() body: { skippedSessionIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.updateSkips(
      id,
      body.skippedSessionIds,
      user,
    );
  }
  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async deleteEnrollment(@Param("id") id: string, @CurrentUser() user: any) {
    return this.enrollmentsService.deleteEnrollment(id, user);
  }
}
