import { z } from "zod";

export const CreateInvoiceLineSchema = z.object({
  enrollmentId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  description: z.string(),
  amount: z.number().min(0),
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  guardianId: z.string().optional(),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  lineItems: z.array(CreateInvoiceLineSchema),
  createdAt: z.string().optional(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
export type CreateInvoiceLineItemDto = z.infer<typeof CreateInvoiceLineSchema>;
