import { z } from "zod";

export const UpdateRemarksSchema = z.object({
  remarks: z.string(),
});

export const UpdateSkipsSchema = z.object({
  skippedSessionIds: z.array(z.string().min(1)),
});

export type UpdateRemarksDto = z.infer<typeof UpdateRemarksSchema>;
export type UpdateSkipsDto = z.infer<typeof UpdateSkipsSchema>;
