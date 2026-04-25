import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateLevelSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    .optional()
    .default("#3b82f6"),
  order: z.number().int().min(0).optional().default(0),
});

export class CreateLevelDto extends createZodDto(CreateLevelSchema) {}
