import { createClient } from "@/lib/supabase/client";

export interface Certificate {
  name: string;
  expirationDate?: string;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  startDate?: string;
  languages?: string[];
  certificates?: Certificate[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

export const getInstructors = async (activeOnly = false) => {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API}/instructors${activeOnly ? "?active=true" : ""}`,
    {
      headers,
    },
  );
  if (!res.ok) throw new Error("Failed to fetch instructors");
  return res.json() as Promise<Instructor[]>;
};

export const getInstructor = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/instructors/${id}`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch instructor");
  return res.json() as Promise<Instructor>;
};

export const createInstructor = async (data: CreateInstructorInput) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/instructors`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create instructor");
  return res.json() as Promise<Instructor>;
};

export const updateInstructor = async (
  id: string,
  data: UpdateInstructorInput,
) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/instructors/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update instructor");
  return res.json() as Promise<Instructor>;
};

export const deleteInstructor = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/instructors/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete instructor");
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
