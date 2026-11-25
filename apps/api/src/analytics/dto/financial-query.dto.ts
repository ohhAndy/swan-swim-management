import { z } from "zod";
import { dateParam } from "../../common/dto/query-params";

export const DateRangeQuerySchema = z.object({
  startDate: dateParam.optional(),
  endDate: dateParam.optional(),
});

export type DateRangeQueryDto = z.infer<typeof DateRangeQuerySchema>;
