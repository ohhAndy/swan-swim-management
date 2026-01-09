import { createZodDto } from "nestjs-zod";
import { createInstructorSchema } from "./create-instructor.dto";

export class UpdateInstructorDto extends createZodDto(
  createInstructorSchema.partial()
) {}
