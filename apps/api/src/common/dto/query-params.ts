import { z } from "zod";

export const dateParam = z.union([
  z.iso.date(),
  z.iso.datetime({ offset: true }),
]);

export const intParam = z.coerce.number().int().min(0);

export const weekdayParam = z.coerce.number().int().min(0).max(6);

export const booleanParam = z
  .enum(["true", "false"])
  .transform((v) => v === "true");
