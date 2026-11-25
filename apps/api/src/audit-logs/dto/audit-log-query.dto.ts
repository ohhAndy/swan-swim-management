import { z } from "zod";
import { dateParam, intParam } from "../../common/dto/query-params";

export const AuditLogQuerySchema = z.object({
  skip: intParam.default(0),
  take: intParam.default(50),
  action: z.string().optional(),
  entityType: z.string().optional(),
  staffId: z.string().optional(),
  startDate: dateParam.optional(),
  endDate: dateParam.optional(),
});

export type AuditLogQueryDto = z.infer<typeof AuditLogQuerySchema>;
