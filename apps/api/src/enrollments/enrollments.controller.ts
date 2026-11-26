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
import {
  CurrentLocationScope,
  fromBody,
  fromBodyList,
  fromParam,
  LocationScope,
  ScopedTo,
} from "../auth/location-scope";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get("uninvoiced")
  @MinRole("manager")
  async findUninvoiced(
    @Query(new ZodValidationPipe(UnInvoicedEnrollmentsQuerySchema))
    query: UnInvoicedEnrollmentsQueryDto,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.enrollmentsService.findUninvoiced(query, scope);
  }

  @Post("with-skip")
  @MinRole("manager")
  @ScopedTo(fromBody("offering", "offeringId"))
  async enrollWithSkips(
    @Body(new ZodValidationPipe(EnrollWithSkipSchema))
    body: EnrollWithSkipInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.enrollWithSkips(body, staffUser);
  }

  @Post(":id/transfer")
  @MinRole("manager")
  @ScopedTo(
    fromParam("enrollment", "id"),
    fromBody("offering", "targetOfferingId"),
  )
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
  @ScopedTo(
    fromBodyList("enrollment", "transfers", "enrollmentId"),
    fromBodyList("offering", "transfers", "targetOfferingId"),
  )
  async bulkTransferEnrollments(
    @Body(new ZodValidationPipe(bulkTransferSchema)) body: BulkTransferDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.bulkTransfer(body.transfers, staffUser);
  }

  @Put(":id/remarks")
  @MinRole("supervisor")
  @ScopedTo(fromParam("enrollment", "id"))
  async updateRemarks(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRemarksSchema)) body: UpdateRemarksDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.updateRemarks(id, body, staffUser);
  }

  @Put(":id/skips")
  @MinRole("manager")
  @ScopedTo(fromParam("enrollment", "id"))
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
  @ScopedTo(fromParam("enrollment", "id"))
  async deleteEnrollment(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.enrollmentsService.deleteEnrollment(id, staffUser);
  }
}
