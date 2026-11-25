import { z } from "zod";

export const AssignInstructorSchema = z.object({
  classOfferingId: z.string().min(1),
  instructorId: z.string().min(1),
});

export type AssignInstructorDto = z.infer<typeof AssignInstructorSchema>;
