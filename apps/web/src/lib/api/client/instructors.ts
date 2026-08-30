import { clientFetch } from "../_fetch/client";
import type { Instructor as PrismaInstructor } from "@prisma/client";

export interface Certificate {
  name: string;
  expirationDate?: string;
}

export type Instructor = Omit<
  PrismaInstructor,
  "certificates" | "email" | "phone" | "gender" | "startDate" | "notes"
> & {
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

export interface InstructorAssignment {
  id: string;
  classOfferingId: string;
  instructorId: string;
  assignedAt: string;
  assignedBy: string | null;
  removedAt: string | null;
  removedBy: string | null;
  instructor: Instructor;
}

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

export async function assignInstructor(
  classOfferingId: string,
  instructorId: string,
): Promise<InstructorAssignment> {
  const response = await clientFetch(`/class-instructors`, {
    method: "POST",
    body: JSON.stringify({ classOfferingId, instructorId }),
  });
  return response.json();
}

export async function removeInstructor(
  assignmentId: string,
): Promise<InstructorAssignment> {
  const response = await clientFetch(`/class-instructors/${assignmentId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function getActiveInstructors(
  classOfferingId: string,
): Promise<InstructorAssignment[]> {
  const response = await clientFetch(
    `/class-instructors/class/${classOfferingId}`,
  );
  return response.json();
}
