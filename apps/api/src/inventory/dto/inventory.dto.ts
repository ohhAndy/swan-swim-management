import { z } from "zod";
import { booleanParam, intParam } from "../../common/dto/query-params";

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

export const CreateInventoryItemSchema = z.object({
  name: z.string().trim().min(1),
  description: optionalText,
  price: z.number().min(0),
  sku: optionalText,
  stock: z.number().int().default(0),
});

export const UpdateInventoryItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: optionalText,
  price: z.number().min(0).optional(),
  sku: optionalText,
  stock: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const InventoryQuerySchema = z.object({
  skip: intParam.optional(),
  take: intParam.optional(),
  search: z.string().optional(),
  active: booleanParam.optional(),
});

export type CreateInventoryItemDto = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof UpdateInventoryItemSchema>;
export type InventoryQueryDto = z.infer<typeof InventoryQuerySchema>;
