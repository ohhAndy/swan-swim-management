import { clientFetch } from "../_fetch/client";

export interface Certificate {
  name: string;
  expirationDate?: string;
}

import type { Instructor as PrismaInstructor } from "@prisma/client";

export type Instructor = Omit<PrismaInstructor, "certificates" | "email" | "phone" | "gender" | "startDate" | "notes"> & {
  email?: string;
  phone?: string;
  gender?: string;
  startDate?: string;
  notes?: string;
  certificates?: Certificate[];
};

export interface CreateInstructorInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  startDate?: string;
  languages?: string[];
  certificates?: Certificate[];
  notes?: string;
  isActive?: boolean;
}

export type UpdateInstructorInput = Partial<CreateInstructorInput>;

export const getInstructors = async (activeOnly = false) => {
  const res = await clientFetch(
    `/instructors${activeOnly ? "?active=true" : ""}`,
  );
  return res.json() as Promise<Instructor[]>;
};

export const getInstructor = async (id: string) => {
  const res = await clientFetch(`/instructors/${id}`);
  return res.json() as Promise<Instructor>;
};

export const createInstructor = async (data: CreateInstructorInput) => {
  const res = await clientFetch(`/instructors`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json() as Promise<Instructor>;
};

export const updateInstructor = async (
  id: string,
  data: UpdateInstructorInput,
) => {
  const res = await clientFetch(`/instructors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json() as Promise<Instructor>;
};

export const deleteInstructor = async (id: string) => {
  const res = await clientFetch(`/instructors/${id}`, { method: "DELETE" });
  return res.json() as Promise<Instructor>;
};

export const searchInstructors = async (query: string) => {
  // Client-side filtering for now
  const all = await getInstructors(true);
  const lowerQuery = query.toLowerCase();
  return all.filter(
    (i) =>
      i.firstName.toLowerCase().includes(lowerQuery) ||
      i.lastName.toLowerCase().includes(lowerQuery),
  );
};
