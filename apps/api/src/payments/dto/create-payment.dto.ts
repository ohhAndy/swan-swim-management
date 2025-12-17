import { z } from "zod";

export const CreatePaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0),
  paymentDate: z.iso.date(),
  paymentMethod: z.enum(["cash", "debit", "visa", "mastercard", "etransfer", "website", "other"]),
  notes: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
