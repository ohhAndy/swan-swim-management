import { z } from "zod";
import { weekdayParam } from "../../common/dto/query-params";

export const SlotQuerySchema = z.object({
  termId: z.string().min(1),
  weekday: weekdayParam,
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  date: z.iso.date(),
});

export type SlotQueryDto = z.infer<typeof SlotQuerySchema>;
