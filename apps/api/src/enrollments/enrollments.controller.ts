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
import { BulkTransferDto, bulkTransferSchema } from "./dto/bulk-transfer.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

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
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.enrollWithSkips(body, staffUser);
  }

  @Post(":id/transfer")
  @Roles("super_admin", "admin", "manager")
  async transferEnrollment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transferEnrollmentSchema))
    body: TransferEnrollmentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.transferEnrollment(id, body, staffUser);
  }

  @Post("bulk-transfer")
  @Roles("super_admin", "admin")
  async bulkTransferEnrollments(
    @Body(new ZodValidationPipe(bulkTransferSchema)) body: BulkTransferDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.bulkTransfer(body.transfers, staffUser);
  }

  @Put(":id/remarks")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateRemarks(
    @Param("id") id: string,
    @Body() body: { remarks: string },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateRemarks(id, body, staffUser);
  }

  @Put(":id/report-card-status")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateReportCardStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateReportCardStatus(
      id,
      body.status,
      staffUser,
    );
  }

  @Put(":id/skips")
  @Roles("super_admin", "admin", "manager")
  async updateSkips(
    @Param("id") id: string,
    @Body() body: { skippedSessionIds: string[] },
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateSkips(
      id,
      body.skippedSessionIds,
      staffUser,
    );
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async deleteEnrollment(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.deleteEnrollment(id, staffUser);
  }
}
