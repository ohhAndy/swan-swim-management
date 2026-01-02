import {
  Body,
  Controller,
  Post,
  Param,
  Put,
  UseGuards,
  Delete,
  Get,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
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
  @Roles("admin", "manager")
  async findUninvoiced() {
    return this.enrollmentsService.findUninvoiced();
  }

  @Post("with-skip")
  @Roles("admin", "manager")
  async enrollWithSkips(
    @Body(new ZodValidationPipe(EnrollWithSkipSchema))
    body: EnrollWithSkipInput,
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.enrollWithSkips(body, user);
  }

  @Post(":id/transfer")
  @Roles("admin", "manager")
  async transferEnrollment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(transferEnrollmentSchema))
    body: TransferEnrollmentDto,
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.transferEnrollment(id, body, user);
  }

  @Put(":id/remarks")
  @Roles("admin", "manager", "supervisor")
  async updateRemarks(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.updateRemarks(id, body, user);
  }
  @Delete(":id")
  @Roles("admin", "manager")
  async deleteEnrollment(@Param("id") id: string, @CurrentUser() user: any) {
    return this.enrollmentsService.deleteEnrollment(id, user);
  }
}
