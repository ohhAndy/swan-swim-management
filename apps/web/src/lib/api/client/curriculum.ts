import { clientFetch } from "../_fetch/client";

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

import type { Skill, Level } from "../../types/models";
export type { Skill, Level };

export async function getLevels(): Promise<Level[]> {
  const res = await clientFetch(`/levels`);
  return res.json();
}

export async function createLevel(data: CreateLevelDto): Promise<Level> {
  const res = await clientFetch(`/levels`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateLevel(
  id: string,
  data: UpdateLevelDto,
): Promise<Level> {
  const res = await clientFetch(`/levels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteLevel(id: string): Promise<void> {
  await clientFetch(`/levels/${id}`, {
    method: "DELETE",
  });
}

export async function createSkill(data: CreateSkillDto): Promise<Skill> {
  const res = await clientFetch(`/skills`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateSkill(
  id: string,
  data: UpdateSkillDto,
): Promise<Skill> {
  const res = await clientFetch(`/skills/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSkill(id: string): Promise<void> {
  await clientFetch(`/skills/${id}`, {
    method: "DELETE",
  });
}
