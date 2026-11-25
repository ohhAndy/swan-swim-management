import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const InvoiceExportQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  status: z.union([z.enum(InvoiceStatus), z.literal("all")]).optional(),
  query: z.string().optional(),
});

export type InvoiceExportQueryDto = z.infer<typeof InvoiceExportQuerySchema>;
