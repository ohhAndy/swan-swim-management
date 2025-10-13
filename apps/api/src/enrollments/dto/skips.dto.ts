import { z } from "zod";

export const addSkipSchema = z.object({
    classSessionId: z.string().min(1),
    reason: z.string().max(500).optional(),
});

export type AddSkipInput = z.infer<typeof addSkipSchema>;