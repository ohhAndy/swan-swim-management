import { z } from "zod";

export const InvoiceQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["paid", "partial", "void", "all"]).optional(),
  guardianId: z.string().optional(),
  startDate: z.string().optional(), // changed to string to match client input nicely, or use z.coerce.date()
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(["createdAt", "invoiceNumber"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  includeAllLocations: z.string().optional(),
});

export type InvoiceQueryDto = z.infer<typeof InvoiceQuerySchema>;
