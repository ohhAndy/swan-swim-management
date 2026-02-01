import { z } from "zod";

export const UpdatePaymentSchema = z.object({
  amount: z.number().min(0).optional(),
  paymentDate: z.string().optional(), // ISO date string
  paymentMethod: z
    .enum([
      "cash",
      "debit",
      "visa",
      "mastercard",
      "etransfer",
      "website",
      "other",
    ])
    .optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentDto = z.infer<typeof UpdatePaymentSchema>;
