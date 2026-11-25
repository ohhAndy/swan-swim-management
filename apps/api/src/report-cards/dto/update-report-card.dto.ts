import { createZodDto } from "nestjs-zod";
import { CreateReportCardSchema } from "./create-report-card.dto";

export const UpdateReportCardSchema = CreateReportCardSchema.partial().extend({
  status: CreateReportCardSchema.shape.status.unwrap().optional(),
});

export class UpdateReportCardDto extends createZodDto(UpdateReportCardSchema) {}
