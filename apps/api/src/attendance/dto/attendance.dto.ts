import { z } from "zod";

export const UpsertAttendanceSchema = z.object({
  classSessionId: z.string().min(1),
  enrollmentId: z.string().min(1),
  status: z.enum(["present", "absent", "excused"]).nullable(), 
  notes: z.string().optional(),
});

export const UpdateMakeupAttendanceSchema = z.object({
    makeUpId: z.string().min(1),
    status: z.enum(["requested", "scheduled", "attended", "cancelled", "missed"]).nullable(),
});

export const PracticeCheckInSchema = z.object({
  classSessionId: z.string().min(1, "Class Session ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["present"]).nullable().optional().default("present"), // null = remove/unmark checkin
  notes: z.string().optional(),
  acknowledgeOverdue: z.boolean().optional().default(false),
  overrideDelinquency: z.boolean().optional().default(false),
});

export type UpsertAttendanceInput = z.infer<typeof UpsertAttendanceSchema>;
export type UpdateMakeupAttendanceInput = z.infer<typeof UpdateMakeupAttendanceSchema>;
export type PracticeCheckInInput = z.input<typeof PracticeCheckInSchema>;