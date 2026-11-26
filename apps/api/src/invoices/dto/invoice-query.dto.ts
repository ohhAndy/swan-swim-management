import { z } from "zod";

export const InvoiceQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["paid", "partial", "void", "refunded", "all"]).optional(),
  guardianId: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(["createdAt", "invoiceNumber"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  needsRecovery: z.string().optional(),
});

export type InvoiceQueryDto = z.infer<typeof InvoiceQuerySchema>;
