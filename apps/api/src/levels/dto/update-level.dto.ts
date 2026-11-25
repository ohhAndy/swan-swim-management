import { createZodDto } from "nestjs-zod";
import { LevelFieldsSchema } from "./create-level.dto";

export class UpdateLevelDto extends createZodDto(LevelFieldsSchema.partial()) {}
