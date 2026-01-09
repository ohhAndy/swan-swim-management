export class CreateTaskDto {
  title: string;
  description?: string;
  assignedToId?: string; // If null, unassigned? Or maybe required.
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string; // ISO Date
}
