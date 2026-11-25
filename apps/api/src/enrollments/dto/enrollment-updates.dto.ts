import { z } from "zod";
import { ReportCardStatus } from "@prisma/client";

export const UpdateRemarksSchema = z.object({
  remarks: z.string(),
});

export const UpdateReportCardStatusSchema = z.object({
  status: z.enum(ReportCardStatus),
});

export const UpdateSkipsSchema = z.object({
  skippedSessionIds: z.array(z.string().min(1)),
});

export type UpdateRemarksDto = z.infer<typeof UpdateRemarksSchema>;
export type UpdateReportCardStatusDto = z.infer<typeof UpdateReportCardStatusSchema>;
export type UpdateSkipsDto = z.infer<typeof UpdateSkipsSchema>;
