import { z } from "zod";

export const InvoiceQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["paid", "partial", "void", "all"]).optional(),
  guardianId: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type InvoiceQueryDto = z.infer<typeof InvoiceQuerySchema>;
