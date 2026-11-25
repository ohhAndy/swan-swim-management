import {
  Body,
  Controller,
  Post,
  Param,
  Put,
  Delete,
  Get,
  Query,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import {
  UnInvoicedEnrollmentsQueryDto,
  UnInvoicedEnrollmentsQuerySchema,
} from "./dto/uninvoiced-enrollments-query.dto";
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
import {
  UpdateRemarksDto,
  UpdateRemarksSchema,
  UpdateSkipsDto,
  UpdateSkipsSchema,
} from "./dto/enrollment-updates.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get("uninvoiced")
  @MinRole("manager")
  async findUninvoiced(
    @Query(new ZodValidationPipe(UnInvoicedEnrollmentsQuerySchema))
    query: UnInvoicedEnrollmentsQueryDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.enrollmentsService.findUninvoiced(query, staffUser, locationId);
  }

  @Post("with-skip")
  @MinRole("manager")
  async enrollWithSkips(
    @Body(new ZodValidationPipe(EnrollWithSkipSchema))
    body: EnrollWithSkipInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.enrollWithSkips(body, staffUser);
  }

  @Post(":id/transfer")
  @MinRole("manager")
  async transferEnrollment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transferEnrollmentSchema))
    body: TransferEnrollmentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.transferEnrollment(id, body, staffUser);
  }

  @Post("bulk-transfer")
  @MinRole("manager")
  async bulkTransferEnrollments(
    @Body(new ZodValidationPipe(bulkTransferSchema)) body: BulkTransferDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.bulkTransfer(body.transfers, staffUser);
  }

  @Put(":id/remarks")
  @MinRole("supervisor")
  async updateRemarks(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRemarksSchema)) body: UpdateRemarksDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateRemarks(id, body, staffUser);
  }

  @Put(":id/skips")
  @MinRole("manager")
  async updateSkips(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateSkipsSchema)) body: UpdateSkipsDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateSkips(
      id,
      body.skippedSessionIds,
      staffUser,
    );
  }

  @Delete(":id")
  @MinRole("manager")
  async deleteEnrollment(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.deleteEnrollment(id, staffUser);
  }
}
