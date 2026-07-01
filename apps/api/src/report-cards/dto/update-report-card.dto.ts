import { createZodDto } from "nestjs-zod";
import { CreateReportCardSchema } from "./create-report-card.dto";

export const UpdateReportCardSchema = CreateReportCardSchema.partial();

export class UpdateReportCardDto extends createZodDto(UpdateReportCardSchema) {}
