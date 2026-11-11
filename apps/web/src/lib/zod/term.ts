import { z } from "zod";

export const TemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM"),
  duration: z.coerce.number().int().min(15).max(240),
  capacity: z.coerce.number().int().min(1).max(50),
  notes: z.string().trim().optional(),
});

export const FeeTierSchema = z.object({
  frequency: z.coerce.number().int().min(1).max(4),
  practiceFee: z.coerce.number().min(0, "Must be 0 or more"),
  meetFee: z.coerce.number().min(0, "Must be 0 or more"),
});

export const FormSchema = z
  .object({
    type: z.enum(["regular", "swim_team_season"]).default("regular"),
    name: z.string().min(1, "Name is required"),
    slug: z.string().trim().optional(),
    startDate: z.string().min(1, "Start Time is required"),
    endDate: z.string().min(1, "End Time is required"),
    weeks: z.coerce.number().int().min(1).max(20).default(8),
    templates: z.array(TemplateSchema),
    feeTiers: z.array(FeeTierSchema).max(4).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date",
  })
  // A swim team season can start with no practices; they are added later.
  .refine((v) => v.type === "swim_team_season" || v.templates.length >= 1, {
    path: ["templates"],
    message: "At least one offering is required",
  });

export type FormInput = z.input<typeof FormSchema>;
export type FormOutput = z.output<typeof FormSchema>;
export type TemplateInput = z.input<typeof TemplateSchema>;
