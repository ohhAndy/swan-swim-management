import { z } from "zod";

export const EnrollWithSkipSchema = z.object({
    studentId: z.string().min(1),
    offeringId: z.string().min(1),
    skippedDates: z.array(z.string()).min(0),
    classRatio: z.string().min(1),
});

export type EnrollWithSkipInput = z.infer<typeof EnrollWithSkipSchema>;