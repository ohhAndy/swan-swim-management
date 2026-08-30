import { Controller, Get, Post, Body, Req, Ip } from "@nestjs/common";
import { PublicService } from "./public.service";
import { Public } from "../auth/public.decorator";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { SubmitTrialRequestDto } from "./dto/trial-request.dto";

@Controller("public")
@Public()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * GET /public/trial-dates
   * Returns available trial dates for the next 30 days.
   * No auth required.
   */
  @Get("trial-dates")
  async getTrialDates() {
    return this.publicService.getAvailableTrialDates();
  }

  /**
   * POST /public/trial-requests
   * Submit a trial class request. Rate-limited.
   * No auth required.
   */
  @Post("trial-requests")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute per IP
  async submitTrialRequest(
    @Body() body: SubmitTrialRequestDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.publicService.submitTrialRequest({
      ...body,
      ipAddress: ip || (req.headers["x-forwarded-for"] as string) || undefined,
    });
  }

  /**
   * GET /public/locations
   * Returns list of public locations for trial booking & contact.
   */
  @Get("locations")
  async getLocations() {
    return this.publicService.getLocations();
  }

  /**
   * GET /public/programs
   * Returns public program/level information.
   * No auth required.
   */
  @Get("programs")
  async getPrograms() {
    return this.publicService.getPrograms();
  }
}
