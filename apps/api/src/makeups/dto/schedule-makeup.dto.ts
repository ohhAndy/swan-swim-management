import { z } from "zod";

export const ScheduleMakeUpSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classSessionId: z.string().min(1, "Class Session ID is required"),
  notes: z.string().optional(),
  classRatio: z.string().default("3:1"),
  overrideAcknowledged: z.boolean().default(false),
});

export type ScheduleMakeUpInput = z.infer<typeof ScheduleMakeUpSchema>;
