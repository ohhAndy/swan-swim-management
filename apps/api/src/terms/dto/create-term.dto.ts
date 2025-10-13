import { z } from "zod";

export const ClassTemplateSchema = z.object({
    title: z.string().min(1),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    duration: z.number().int().min(15).max(240),
    capacity: z.number().int().min(1).max(50),
    notes: z.string().trim().optional(),
});

export const CreateTermSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    startDate: z.preprocess((val) => new Date(val as string), z.date()),
    endDate: z.preprocess((val) => new Date(val as string), z.date()),
    weeks: z.number().int().min(1).max(20).default(8),
    templates: z.array(ClassTemplateSchema).min(1),
});

export type CreateTermInput = z.infer<typeof CreateTermSchema>;