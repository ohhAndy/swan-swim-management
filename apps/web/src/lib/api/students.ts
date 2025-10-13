import { CreateStudentInput } from "../zod/student";
import { createServerSupabaseClient } from "../supabase/server";
import { createClient } from "../supabase/client";

export type StudentLite = { id: string; firstName: string; lastName: string; shortCode: string | null };

const API = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
}


export async function searchStudents(params: {
  query?: string;
  page?: number;
  pageSize?: number;
  enrollmentStatus?: string;
  level?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.set('query', params.query);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.enrollmentStatus) searchParams.set('enrollmentStatus', params.enrollmentStatus);
  if (params.level) searchParams.set('level', params.level);

  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/students?${searchParams.toString()}`, {
    cache: 'no-store', 
    headers,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(`Failed to enroll student: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}

export async function createStudent(input: CreateStudentInput) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/students`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => "Create student failed"));
  }

  return res.json;
}

export async function getStudentById(studentId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/students/${studentId}`, {
    cache: 'no-store', // Always fetch fresh data for student details
    headers,
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch student: ${res.status}`);
  }
  
  return res.json();
}

export async function updateStudent(studentId: string, data: {
  firstName?: string;
  lastName?: string;
  shortCode?: string | null;
  level?: string | null;
  birthdate?: string | null;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/students/${studentId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update student: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}