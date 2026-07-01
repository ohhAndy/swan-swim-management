import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateSkillSchema = z.object({
  description: z.string(),
  levelId: z.string(),
  order: z.number().int().min(0).optional().default(0),
});

export class CreateSkillDto extends createZodDto(CreateSkillSchema) {}
