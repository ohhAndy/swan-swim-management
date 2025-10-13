import { z } from "zod";

const phoneRegex = /^\d{3}[-\s]\d{3}[-\s]\d{4}$/;

export const addressSchema = z.object({
  streetNumber: z.string().min(1, "Street number required"),
  streetName: z.string().min(1, "Street name required"),
  unit: z.string().min(1).optional().transform(v => v || undefined),
  city: z.string().min(1),
  province: z.string().min(1),                
  postalCode: z.string().min(3).max(12),    
  countryCode: z.string().length(2).transform(s => s.toUpperCase()),
});

export type AddressDto = z.infer<typeof addressSchema>

export const createGuardianSchema = z.object({
    fullName: z.string().min(1).max(120),
    shortCode: z.string().min(1).max(32).optional(),
    email: z.email(),
    phone: z.string().regex(phoneRegex, "Invalid phone number"),
    address: addressSchema.optional(),
    notes: z.string().max(1000).optional(),
});


export type CreateGuardianDto = z.infer<typeof createGuardianSchema>;

export const updateGuardianSchema = createGuardianSchema.partial();
export type UpdateGuardianDto = z.infer<typeof updateGuardianSchema>;

export const searchGuardianSchema = z.object({
    query: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});
export type SearchGuardianDto = z.infer<typeof searchGuardianSchema>;