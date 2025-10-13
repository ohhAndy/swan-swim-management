import { z } from "zod";

export const createStudentSchema = z.object({
    guardianId: z.string(),
    shortCode: z.string().min(1).max(32).optional(),
    firstName: z.string().min(1).max(64),
    lastName: z.string().min(1).max(64),
    level: z.string().optional(),
    birthdate: z.coerce.date().optional(),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema.partial();
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;

export const searchStudentsSchema = z.object({
    query: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    guardianId: z.string().optional(),
    enrollmentStatus: z.enum(["active", "inactive"]).optional(),
    level: z.string().optional(),
});
export type SearchStudentsDto = z.infer<typeof searchStudentsSchema>;