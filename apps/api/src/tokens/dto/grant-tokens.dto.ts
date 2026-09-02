import { z } from "zod";

export const GrantExtraTokensSchema = z.object({
  enrollmentId: z.string().min(1),
  count: z.number().int().min(1).max(10).default(1),
  notes: z.string().min(1, "Notes are required for granting extra tokens"),
});

export type GrantExtraTokensInput = z.infer<typeof GrantExtraTokensSchema>;
