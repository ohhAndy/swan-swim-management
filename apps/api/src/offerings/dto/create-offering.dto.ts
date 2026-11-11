import { z } from "zod";

export const CreateOfferingSchema = z.object({
  termId: z.string().min(1),
  type: z.enum(["regular", "flexible", "swim_team"]).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  title: z.string().min(1),
  capacity: z.number().int().min(1),
  duration: z.number().int().min(15).max(240).optional(),
  notes: z.string().optional(),
  sessions: z
    .array(
      z.object({
        date: z.string().min(1),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
      }),
    )
    .optional(),
});

export type CreateOfferingInput = z.infer<typeof CreateOfferingSchema>;
