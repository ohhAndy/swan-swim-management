import { z } from "zod";
import { CreatePaymentSchema } from "./create-payment.dto";

export const UpdatePaymentSchema = CreatePaymentSchema.omit({
  invoiceId: true,
}).partial();

export type UpdatePaymentDto = z.infer<typeof UpdatePaymentSchema>;
