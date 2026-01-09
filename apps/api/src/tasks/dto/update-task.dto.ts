export class UpdateTaskDto {
  title?: string;
  description?: string;
  assignedToId?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}
