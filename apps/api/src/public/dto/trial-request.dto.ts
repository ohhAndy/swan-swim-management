import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const SubmitTrialRequestSchema = z.object({
  parentName: z.string().min(2, "Parent name is required"),
  parentPhone: z.string().min(7, "Valid phone number is required"),
  parentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  childName: z.string().min(2, "Child name is required"),
  childAge: z.coerce.number().min(0, "Invalid age").max(18, "Invalid age"),
  preferredDates: z
    .array(z.string().min(1))
    .min(1, "Select between 1 and 5 preferred dates")
    .max(5, "Select between 1 and 5 preferred dates"),
  locationId: z.string().optional(),
  locationSlug: z.string().optional(),
  notes: z.string().optional(),
  cookieId: z.string().optional(),
});

export class SubmitTrialRequestDto extends createZodDto(
  SubmitTrialRequestSchema,
) {}
