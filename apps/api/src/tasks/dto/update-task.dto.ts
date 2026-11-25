import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import { CreateTaskSchema } from "./create-task.dto";

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(TaskStatus).optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
