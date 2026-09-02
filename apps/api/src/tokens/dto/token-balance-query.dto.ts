import { z } from "zod";

export const TokenBalanceQuerySchema = z.object({
  termId: z.string().optional(),
});

export type TokenBalanceQueryInput = z.infer<typeof TokenBalanceQuerySchema>;
