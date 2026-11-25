import { createZodDto } from "nestjs-zod";
import { SkillFieldsSchema } from "./create-skill.dto";

export class UpdateSkillDto extends createZodDto(SkillFieldsSchema.partial()) {}
