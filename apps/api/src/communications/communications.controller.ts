import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CommunicationsService } from "./communications.service";
import { RecipientFilterDto, SendEmailDto } from "./dto/communications.dto";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
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
}
