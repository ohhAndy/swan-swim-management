import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";
import { dateParam } from "../../common/dto/query-params";

export const InvoiceExportQuerySchema = z.object({
  startDate: dateParam.optional(),
  endDate: dateParam.optional(),
  status: z.union([z.enum(InvoiceStatus), z.literal("all")]).optional(),
  query: z.string().optional(),
});

export type InvoiceExportQueryDto = z.infer<typeof InvoiceExportQuerySchema>;
