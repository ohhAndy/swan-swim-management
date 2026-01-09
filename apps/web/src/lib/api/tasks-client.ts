import { getHeaders } from "./headers";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getTasks(): Promise<Task[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/tasks`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<Task> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete task");
}
