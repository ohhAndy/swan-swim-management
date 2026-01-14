import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { Public } from "../auth/public.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return { status: "ok" };
  }
}
