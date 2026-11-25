import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { dateParam } from "../../common/dto/query-params";

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number(),
  paymentDate: dateParam,
  paymentMethod: z.enum(PaymentMethod),
  notes: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
