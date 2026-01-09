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
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("instructors")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@UsePipes(ZodValidationPipe)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Post()
  @Roles("admin", "manager")
  create(
    @Body() createInstructorDto: CreateInstructorDto,
    @CurrentUser() user: any
  ) {
    return this.instructorsService.create(createInstructorDto, user);
  }

  @Get()
  @Roles("admin", "manager", "supervisor", "viewer")
  findAll(@Query("active") active?: string) {
    return this.instructorsService.findAll(active === "true");
  }

  @Get(":id")
  @Roles("admin", "manager", "supervisor", "viewer")
  findOne(@Param("id") id: string) {
    return this.instructorsService.findOne(id);
  }

  @Patch(":id")
  @Roles("admin", "manager")
  update(
    @Param("id") id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
    @CurrentUser() user: any
  ) {
    return this.instructorsService.update(id, updateInstructorDto, user);
  }

  @Delete(":id")
  @Roles("admin", "manager")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.instructorsService.remove(id, user);
  }
}
