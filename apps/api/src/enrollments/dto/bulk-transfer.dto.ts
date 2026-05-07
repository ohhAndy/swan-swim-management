import { z } from "zod";

export const bulkTransferSchema = z.object({
  transfers: z.array(
    z.object({
      enrollmentId: z.string().min(1),
      targetOfferingId: z.string().min(1),
      transferNotes: z.string().optional(),
    }),
  ).min(1, "At least one transfer is required"),
});

export type BulkTransferDto = z.infer<typeof bulkTransferSchema>;
