import { z } from "zod";
import { TaskPriority } from "@prisma/client";

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  assignedToId: z.string().min(1).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.iso.date().optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
