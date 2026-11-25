import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { ClassInstructorsService } from "./class-instructors.service";
import {
  AssignInstructorDto,
  AssignInstructorSchema,
} from "./dto/assign-instructor.dto";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("class-instructors")
export class ClassInstructorsController {
  constructor(private readonly service: ClassInstructorsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager", "supervisor")
  async assignInstructor(
    @Body(new ZodValidationPipe(AssignInstructorSchema))
    body: AssignInstructorDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.assignInstructor(
      body.classOfferingId,
      body.instructorId,
      staffUser,
    );
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async removeInstructor(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.service.removeInstructor(id, staffUser);
  }

  @Get("class/:classOfferingId")
  @Roles("super_admin", "admin", "manager", "supervisor", "viewer")
  async getActiveInstructors(
    @Param("classOfferingId") classOfferingId: string,
  ) {
    return this.service.getActiveInstructorsForClass(classOfferingId);
  }

  @Get("class/:classOfferingId/history")
  async getInstructorHistory(
    @Param("classOfferingId") classOfferingId: string,
  ) {
    return this.service.getInstructorHistory(classOfferingId);
  }

  @Get("instructor/:instructorId")
  async getClassesForInstructor(@Param("instructorId") instructorId: string) {
    return this.service.getClassesForInstructor(instructorId, true);
  }
}
