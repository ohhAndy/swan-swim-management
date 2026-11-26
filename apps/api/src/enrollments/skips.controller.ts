import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SkipsService } from "./skips.service";
import { AddSkipInput, addSkipSchema } from "./dto/skips.dto";

import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import { fromParam, ScopedTo } from "../auth/location-scope";

@Controller("enrollments/:enrollmentId/skips")
@ScopedTo(fromParam("enrollment", "enrollmentId"))
export class SkipsController {
  constructor(private readonly skipsService: SkipsService) {}

  @Post()
  @MinRole("manager")
  async add(
    @Param("enrollmentId") enrollmentId: string,
    @Body(new ZodValidationPipe(addSkipSchema)) body: AddSkipInput,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.skipsService.addSkip(enrollmentId, body, staffUser);
  }

  @Delete(":classSessionId")
  @MinRole("manager")
  async delete(
    @Param("enrollmentId") enrollmentId: string,
    @Param("classSessionId") classSessionId: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.skipsService.deleteSkip(enrollmentId, classSessionId, staffUser);
  }
}
