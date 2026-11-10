import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ReportCardSkillSchema = z.object({
  skillId: z.string(),
  status: z.enum(["not_started", "developing", "mastered"]),
  comments: z.string().optional(),
});

export const CreateReportCardSchema = z.object({
  enrollmentId: z.string(),
  levelId: z.string(),
  // "sent" is only set by POST /report-cards/:id/email, never directly.
  status: z.enum(["draft", "completed", "did_not_pass"]).default("draft"),
  comments: z.string().optional(),
  skills: z.array(ReportCardSkillSchema).optional(),
});

export class CreateReportCardDto extends createZodDto(CreateReportCardSchema) {}
