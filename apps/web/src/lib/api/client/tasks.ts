import { clientFetch } from "../_fetch/client";

import type { Task } from "../../types/models";
export type { Task };

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
