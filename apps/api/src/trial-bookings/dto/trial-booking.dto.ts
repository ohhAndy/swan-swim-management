import { z } from "zod";
import { TrialStatus } from "@prisma/client";

export const CreateTrialBookingSchema = z.object({
  classSessionId: z.string().min(1),
  childName: z.string().trim().min(1),
  childAge: z.number().int().min(0).max(120),
  parentPhone: z.string().trim().min(1),
  notes: z.string().optional(),
  classRatio: z.enum(["1:1", "2:1", "3:1"]).default("3:1"),
});

export const UpdateTrialStatusSchema = z.object({
  status: z.enum(TrialStatus),
});

export const UpdateTrialNotesSchema = z.object({
  notes: z.string().nullable(),
});

export const ConvertTrialSchema = z.object({
  studentId: z.string().min(1),
});

export type CreateTrialBookingDto = z.infer<typeof CreateTrialBookingSchema>;
export type UpdateTrialStatusDto = z.infer<typeof UpdateTrialStatusSchema>;
export type UpdateTrialNotesDto = z.infer<typeof UpdateTrialNotesSchema>;
export type ConvertTrialDto = z.infer<typeof ConvertTrialSchema>;
