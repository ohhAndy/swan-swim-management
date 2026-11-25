import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { InstructorsService } from "./instructor.service";
import { CreateInstructorDto } from "./dto/create-instructor.dto";
import { UpdateInstructorDto } from "./dto/update-instructor.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("instructors")
@UsePipes(ZodValidationPipe)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Post()
  @MinRole("manager")
  create(
    @Body() createInstructorDto: CreateInstructorDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.instructorsService.create(createInstructorDto, staffUser);
  }

  @Get()
  @MinRole("supervisor")
  findAll(@Query("active") active?: string) {
    return this.instructorsService.findAll(active === "true");
  }

  @Get(":id")
  @MinRole("supervisor")
  findOne(@Param("id") id: string) {
    return this.instructorsService.findOne(id);
  }

  @Patch(":id")
  @MinRole("manager")
  update(
    @Param("id") id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.instructorsService.update(id, updateInstructorDto, staffUser);
  }

  @Delete(":id")
  @MinRole("manager")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.instructorsService.remove(id, staffUser);
  }
}
