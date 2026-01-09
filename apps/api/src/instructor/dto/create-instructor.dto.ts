import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createInstructorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.string().optional(),
  languages: z.array(z.string()).optional(),
  certificates: z.array(z.any()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class CreateInstructorDto extends createZodDto(createInstructorSchema) {}
