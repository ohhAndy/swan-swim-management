import { z } from "zod";

export const UpdateOfferingInfoSchema = z.object({
  title: z.string(),
});

export const TransferOptionsQuerySchema = z.object({
  termId: z.string().min(1),
  excludeOfferingId: z.string().min(1),
  level: z.string().optional(),
});

export type UpdateOfferingInfoDto = z.infer<typeof UpdateOfferingInfoSchema>;
export type TransferOptionsQueryDto = z.infer<typeof TransferOptionsQuerySchema>;
