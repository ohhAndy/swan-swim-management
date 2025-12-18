import { z } from "zod";

export const CreateStudentSchema = z.object({
  guardianId: z.string().min(1, "Guardian is required!"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shortCode: z.string().min(1).max(32).optional().or(z.literal("")).transform(v => v || undefined),
  level: z.string().optional(),
  birthdate: z.string().optional(),
});

export type CreateStudentInput = z.input<typeof CreateStudentSchema>;
export type CreateStudentOutput = z.output<typeof CreateStudentSchema>;