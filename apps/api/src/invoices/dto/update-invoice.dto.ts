import { z } from "zod";

export const UpdateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  totalAmount: z.number().min(0).optional(),
  status: z.enum(["paid", "partial", "void"]).optional(),
  notes: z.string().optional(),
});

export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
