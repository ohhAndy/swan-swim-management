import { clientFetch } from "../_fetch/client";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
  createdBy?: {
    id: string;
    fullName: string;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedToId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedToId?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}

export async function getTasks(): Promise<Task[]> {
  const res = await clientFetch(`/tasks`, {
  });
  return res.json();
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const res = await clientFetch(`/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<Task> {
  const res = await clientFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  await clientFetch(`/tasks/${id}`, {
    method: "DELETE",
  });
}
