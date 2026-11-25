import { z } from "zod";

export const DashboardStatsQuerySchema = z.object({
  termId: z.string().min(1),
});

export type DashboardStatsQueryDto = z.infer<typeof DashboardStatsQuerySchema>;
