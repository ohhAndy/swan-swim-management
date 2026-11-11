import { z } from "zod";

export const ClassTemplateSchema = z.object({
    title: z.string().min(1),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    duration: z.number().int().min(15).max(240),
    capacity: z.number().int().min(1).max(50),
    notes: z.string().trim().optional(),
});

export const SwimTeamFeeTierSchema = z.object({
    frequency: z.number().int().min(1).max(4),
    practiceFee: z.number().min(0),
    meetFee: z.number().min(0),
});

export const CreateTermSchema = z
    .object({
        name: z.string().min(1),
        slug: z.string().min(1).optional(),
        type: z.enum(["regular", "swim_team_season"]).default("regular"),
        startDate: z.preprocess((val) => new Date(val as string), z.date()),
        endDate: z.preprocess((val) => new Date(val as string), z.date()),
        weeks: z.number().int().min(1).max(20).default(8),
        // A swim team season can start empty; practices are added afterwards.
        templates: z.array(ClassTemplateSchema).default([]),
        feeTiers: z.array(SwimTeamFeeTierSchema).max(4).optional(),
    })
    .superRefine((val, ctx) => {
        if (val.type === "regular" && val.templates.length < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["templates"],
                message: "At least one class template is required",
            });
        }
        if (val.feeTiers) {
            const seen = new Set(val.feeTiers.map((t) => t.frequency));
            if (seen.size !== val.feeTiers.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["feeTiers"],
                    message: "Each frequency can only appear once",
                });
            }
        }
    });

export const UpdateSwimTeamFeesSchema = z.object({
    tiers: z.array(SwimTeamFeeTierSchema).min(1).max(4),
});

export type SwimTeamFeeTierInput = z.infer<typeof SwimTeamFeeTierSchema>;
export type UpdateSwimTeamFeesInput = z.infer<typeof UpdateSwimTeamFeesSchema>;

type ParsedTerm = z.infer<typeof CreateTermSchema>;
// `type` stays optional for callers; an omitted type means a regular term.
export type CreateTermInput = Omit<ParsedTerm, "type"> & {
    type?: ParsedTerm["type"];
};