import { z } from "zod";

export const UpsertAttendanceSchema = z.object({
  classSessionId: z.string().min(1),
  enrollmentId: z.string().min(1),
  status: z.enum(["present", "absent", "excused"]).nullable(), 
  notes: z.string().optional(),
  // Staff confirmed checking in a swim team member who is behind on payments
  acknowledgedOverdue: z.boolean().optional(),
});

export const UpdateMakeupAttendanceSchema = z.object({
    makeUpId: z.string().min(1),
    status: z.enum(["requested", "scheduled", "attended", "cancelled", "missed"]).nullable(),
});

export type UpsertAttendanceInput = z.infer<typeof UpsertAttendanceSchema>;
export type UpdateMakeupAttendanceInput = z.infer<typeof UpdateMakeupAttendanceSchema>;