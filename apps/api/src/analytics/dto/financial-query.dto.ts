import { z } from "zod";

export const DateRangeQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export type DateRangeQueryDto = z.infer<typeof DateRangeQuerySchema>;
