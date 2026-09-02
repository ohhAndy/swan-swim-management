import { z } from "zod";

export const VoidTokenSchema = z.object({
  notes: z.string().min(1, "Notes are required when voiding a token"),
});

export type VoidTokenInput = z.infer<typeof VoidTokenSchema>;
