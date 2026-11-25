import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const SkillFieldsSchema = z.object({
  description: z.string(),
  levelId: z.string(),
  order: z.number().int().min(0).optional(),
});

export const CreateSkillSchema = SkillFieldsSchema.extend({
  order: SkillFieldsSchema.shape.order.default(0),
});

export class CreateSkillDto extends createZodDto(CreateSkillSchema) {}
