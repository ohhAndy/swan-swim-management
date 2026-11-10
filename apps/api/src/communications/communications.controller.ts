import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Request } from "express";
import { CommunicationsService } from "./communications.service";
import {
  RecipientFilterDto,
  SendEmailDto,
  GetCommunicationHistoryDto,
} from "./dto/communications.dto";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("communications")
@UseGuards(RolesGuard)
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Post("recipients")
  @Roles("admin", "super_admin", "manager")
  async getRecipients(@Body() filters: RecipientFilterDto) {
    return this.service.getRecipients(filters);
  }

  @Post("send")
  @Roles("admin", "super_admin", "manager")
  async sendEmail(
    @Body() dto: SendEmailDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.sendEmail(dto, staffUser);
  }

  @Get("history")
  @Roles("admin", "super_admin", "manager")
  async getHistory(@Query() query: GetCommunicationHistoryDto) {
    return this.service.getHistory(query);
  }

  @Get("history/:id")
  @Roles("admin", "super_admin", "manager")
  async getHistoryById(@Param("id") id: string) {
    return this.service.getHistoryById(id);
  }

  // Public because Resend can't send a Supabase token; authenticated by signature instead.
  @Post("webhooks/resend")
  @Public()
  @SkipThrottle()
  async handleResendWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("svix-id") id: string | undefined,
    @Headers("svix-timestamp") timestamp: string | undefined,
    @Headers("svix-signature") signature: string | undefined,
  ) {
    const event = this.service.verifyResendWebhook(req.rawBody, {
      id,
      timestamp,
      signature,
    });
    return this.service.handleWebhook(event);
  }
}
