import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const EmailReportCardSchema = z.object({
  pdfContent: z.string().min(1, "pdfContent is required"),
  force: z.boolean().optional().default(false),
});

export class EmailReportCardDto extends createZodDto(EmailReportCardSchema) {}
