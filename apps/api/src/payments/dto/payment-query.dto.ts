import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { dateParam, intParam } from "../../common/dto/query-params";

export const PaymentFilterSchema = z.object({
  startDate: dateParam.optional(),
  endDate: dateParam.optional(),
  method: z.union([z.enum(PaymentMethod), z.literal("all")]).optional(),
  query: z.string().optional(),
});

export const PaymentQuerySchema = PaymentFilterSchema.extend({
  page: intParam.min(1).default(1),
  limit: intParam.min(1).default(50),
});

export type PaymentFilterDto = z.infer<typeof PaymentFilterSchema>;
export type PaymentQueryDto = z.infer<typeof PaymentQuerySchema>;
