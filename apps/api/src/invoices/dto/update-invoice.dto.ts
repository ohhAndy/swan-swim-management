import { z } from "zod";

export const UpdateInvoiceLineItemSchema = z.object({
  id: z.string().optional(),
  enrollmentId: z.string().optional(), // Can bind/unbind enrollment
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
});

export const UpdateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  totalAmount: z.number().min(0).optional(),
  status: z.enum(["paid", "partial", "void"]).optional(),
  notes: z.string().optional(),
  lineItems: z.array(UpdateInvoiceLineItemSchema).optional(),
});

export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
