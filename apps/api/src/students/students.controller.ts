import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { StudentsService } from "./students.service";
import { ZodValidationPipe } from "nestjs-zod";
import {
  createStudentSchema,
  updateStudentSchema,
  searchStudentsSchema,
  SearchStudentsDto,
  CreateStudentDto,
  UpdateStudentDto,
} from "./dto/schemas.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentStaffUser } from "../auth/current-user.decorator";

@Controller("students")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async searchOrList(
    @Query(new ZodValidationPipe(searchStudentsSchema))
    query: SearchStudentsDto,
  ) {
    return this.studentsService.searchOrList(query);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.studentsService.getById(id);
  }

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body(new ZodValidationPipe(createStudentSchema)) body: CreateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.create(body, user);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentSchema)) body: UpdateStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.update(id, body, user);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    return this.studentsService.delete(id, user);
  }
}
