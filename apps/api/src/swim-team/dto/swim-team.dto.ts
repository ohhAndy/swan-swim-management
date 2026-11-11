import { z } from "zod";

const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

export const CreateRegistrationSchema = z
  .object({
    studentId: z.string().min(1),
    termId: z.string().min(1),
    frequency: z.number().int().min(1).max(4),
    competing: z.boolean().default(false),
    offeringIds: z.array(z.string().min(1)).min(1).max(4),
    startDate: DateString.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.offeringIds.length === v.frequency, {
    path: ["offeringIds"],
    message: "Pick exactly one practice slot per weekly practice",
  })
  .refine((v) => uniqueIds(v.offeringIds), {
    path: ["offeringIds"],
    message: "Each practice slot can only be picked once",
  });

export const UpdateRegistrationSchema = z
  .object({
    frequency: z.number().int().min(1).max(4).optional(),
    competing: z.boolean().optional(),
    offeringIds: z.array(z.string().min(1)).min(1).max(4).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => !v.offeringIds || uniqueIds(v.offeringIds), {
    path: ["offeringIds"],
    message: "Each practice slot can only be picked once",
  });

export const RegistrationQuerySchema = z.object({
  studentId: z.string().min(1).optional(),
  termId: z.string().min(1).optional(),
});

export const UninvoicedRegistrationQuerySchema = z.object({
  guardianId: z.string().min(1).optional(),
});

export type CreateRegistrationInput = z.infer<typeof CreateRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof UpdateRegistrationSchema>;
export type RegistrationQuery = z.infer<typeof RegistrationQuerySchema>;
export type UninvoicedRegistrationQuery = z.infer<
  typeof UninvoicedRegistrationQuerySchema
>;
