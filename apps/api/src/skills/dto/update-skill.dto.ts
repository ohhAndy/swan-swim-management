import { createZodDto } from "nestjs-zod";
import { CreateSkillSchema } from "./create-skill.dto";

export class UpdateSkillDto extends createZodDto(CreateSkillSchema.partial()) {}
