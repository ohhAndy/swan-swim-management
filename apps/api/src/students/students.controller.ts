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
  updateStudentNotesSchema,
  UpdateStudentNotesDto,
} from "./dto/schemas.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser, StaffUserWithLocations } from "../auth/auth.types";

@Controller("students")
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
  @MinRole("manager")
  async create(
    @Body(new ZodValidationPipe(createStudentSchema)) body: CreateStudentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.studentsService.create(body, staffUser);
  }

  @Patch(":id")
  @MinRole("manager")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentSchema)) body: UpdateStudentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.studentsService.update(id, body, staffUser);
  }

  @Put(":id/notes")
  @MinRole("supervisor")
  async updateNotes(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentNotesSchema))
    body: UpdateStudentNotesDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.studentsService.updateNotes(id, body.notes, staffUser);
  }

  @Delete(":id")
  @MinRole("manager")
  async delete(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.studentsService.delete(id, staffUser);
  }
}
