export interface CreateLevelDto {
  name: string;
  description?: string;
  color?: string;
  order?: number;
}

export type UpdateLevelDto = Partial<CreateLevelDto>;

export interface CreateSkillDto {
  description: string;
  levelId: string;
  order?: number;
}

export type UpdateSkillDto = Partial<CreateSkillDto>;

export interface Skill {
  id: string;
  description: string;
  order: number;
  levelId: string;
}

export interface Level {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  skills: Skill[];
}

import { getHeaders } from "./headers";

const API_Base = process.env.NEXT_PUBLIC_API_URL!;

export async function getLevels(): Promise<Level[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/levels`, { headers });
  if (!res.ok) throw new Error("Failed to fetch levels");
  return res.json();
}

export async function createLevel(data: CreateLevelDto): Promise<Level> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/levels`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create level");
  return res.json();
}

export async function updateLevel(
  id: string,
  data: UpdateLevelDto,
): Promise<Level> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/levels/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update level");
  return res.json();
}

export async function deleteLevel(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/levels/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete level");
}

export async function createSkill(data: CreateSkillDto): Promise<Skill> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/skills`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create skill");
  return res.json();
}

export async function updateSkill(
  id: string,
  data: UpdateSkillDto,
): Promise<Skill> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/skills/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update skill");
  return res.json();
}

export async function deleteSkill(id: string): Promise<void> {
  const headers = await getHeaders();
  const res = await fetch(`${API_Base}/skills/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete skill");
}
