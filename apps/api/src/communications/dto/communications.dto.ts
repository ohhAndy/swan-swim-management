import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const RecipientFilterSchema = z.object({
  locationId: z.string().optional(),
  termId: z.string().optional(),
  level: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().optional(), // HH:mm
  endTime: z.string().optional(), // HH:mm
  instructorId: z.string().optional(),
});

export class RecipientFilterDto extends createZodDto(RecipientFilterSchema) {}

export const SendEmailSchema = z.object({
  recipients: z.array(z.string().email()),
  subject: z.string().min(1),
  body: z.string().min(1),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64 content
      }),
    )
    .optional(),
});

export class SendEmailDto extends createZodDto(SendEmailSchema) {}
