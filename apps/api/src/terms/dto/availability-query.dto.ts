import { z } from "zod";
import { weekdayParam } from "../../common/dto/query-params";

export const AvailabilityQuerySchema = z.object({
  level: z.string().optional(),
  weekday: weekdayParam.optional(),
});

export type AvailabilityQueryDto = z.infer<typeof AvailabilityQuerySchema>;
