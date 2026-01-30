import { z } from "zod";

export const UnInvoicedEnrollmentsQuerySchema = z.object({
  guardianId: z.string().optional(),
  termId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  includeAllLocations: z.string().optional(),
  locationId: z.string().optional(),
});

export type UnInvoicedEnrollmentsQueryDto = z.infer<
  typeof UnInvoicedEnrollmentsQuerySchema
>;
