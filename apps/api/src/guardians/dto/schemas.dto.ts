import { z } from "zod";

const phoneRegex = /^\d{3}[-\s]\d{3}[-\s]\d{4}$/;

export const createGuardianSchema = z.object({
  fullName: z.string().min(1).max(120),
  shortCode: z.string().min(1).max(32).optional(),
  email: z.email(),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),

  notes: z.string().max(1000).optional(),
  waiverSigned: z.boolean().default(false),
});

export type CreateGuardianDto = z.infer<typeof createGuardianSchema>;

export const updateGuardianSchema = createGuardianSchema.partial();
export type UpdateGuardianDto = z.infer<typeof updateGuardianSchema>;

export const searchGuardianSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  waiverStatus: z.enum(["signed", "pending"]).optional(),
});
export type SearchGuardianDto = z.infer<typeof searchGuardianSchema>;
