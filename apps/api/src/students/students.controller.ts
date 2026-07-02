import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Patch,
  Put,
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
import { AuthenticatedUser, StaffUserWithLocations } from "../auth/auth.types";

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
  async getById(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: StaffUserWithLocations,
  ) {
    return this.studentsService.getById(id, staffUser);
  }

  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body(new ZodValidationPipe(createStudentSchema)) body: CreateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.create(body, user);
  }

  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentSchema)) body: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.update(id, body, user);
  }

  @Put(":id/notes")
  @Roles("super_admin", "admin", "manager", "supervisor")
  async updateNotes(
    @Param("id") id: string,
    @Body() body: { notes: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.updateNotes(id, body.notes, user);
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "manager")
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.delete(id, user);
  }
}
