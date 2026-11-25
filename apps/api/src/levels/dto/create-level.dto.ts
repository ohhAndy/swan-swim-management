import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const LevelFieldsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    .optional(),
  order: z.number().int().min(0).optional(),
});

export const CreateLevelSchema = LevelFieldsSchema.extend({
  color: LevelFieldsSchema.shape.color.default("#3b82f6"),
  order: LevelFieldsSchema.shape.order.default(0),
});

export class CreateLevelDto extends createZodDto(CreateLevelSchema) {}
