import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UsePipes,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { InstructorsService } from "./instructor.service";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("instructors")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@UsePipes(ZodValidationPipe)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Post()
  @Roles("super_admin", "admin", "manager")
  create(
    @Body() createInstructorDto: CreateInstructorDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.instructorsService.create(createInstructorDto, staffUser);
  }

  @Get()
  @Roles("super_admin", "admin", "manager", "supervisor", "viewer")
  findAll(@Query("active") active?: string) {
    return this.instructorsService.findAll(active === "true");
  }

  @Get(":id")
  @Roles("super_admin", "admin", "manager", "supervisor", "viewer")
  findOne(@Param("id") id: string) {
    return this.instructorsService.findOne(id);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  update(
    @Param("id") id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.instructorsService.update(id, updateInstructorDto, staffUser);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.instructorsService.remove(id, staffUser);
  }
}
