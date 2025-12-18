import { z } from "zod";

export const transferEnrollmentSchema = z.object({
  targetOfferingId: z.string().min(1, "Target offering ID is required"),
  skippedSessionIds: z.array(z.string()).default([]),
  transferNotes: z.string().optional(),
});

export type TransferEnrollmentDto = z.infer<typeof transferEnrollmentSchema>;