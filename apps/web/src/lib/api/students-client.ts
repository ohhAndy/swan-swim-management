import { CreateStudentInput } from "../zod/student";
import { getHeaders } from "./headers";

export type StudentLite = {
  id: string;
  firstName: string;
  lastName: string;
  shortCode: string | null;
  level: string | null;
  birthdate: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL!;

export async function searchStudents(params: {
  query?: string;
  page?: number;
  pageSize?: number;
  enrollmentStatus?: string;
  level?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set("query", params.query);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.enrollmentStatus)
    searchParams.set("enrollmentStatus", params.enrollmentStatus);
  if (params.level) searchParams.set("level", params.level);

  const headers = await getHeaders();
  const res = await fetch(`${API}/students?${searchParams.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch students: ${res.status}`);
  }

  return res.json();
}

export async function createStudent(input: CreateStudentInput) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/students`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => "Create student failed"));
  }

  return res.json();
}

export async function updateStudent(
  studentId: string,
  data: {
    firstName?: string;
    lastName?: string;
    shortCode?: string | null;
    level?: string | null;
    birthdate?: string | null;
  }
) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/students/${studentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update student: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function getStudentById(studentId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/students/${studentId}`, {
    cache: "no-store", // Always fetch fresh data for student details
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch student: ${res.status}`);
  }

  return res.json();
}

export async function updateRemarks(enrollmentId: string, remarks: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API}/enrollments/${enrollmentId}/remarks`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ remarks }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    throw new Error(`Failed to enroll student: ${res.status} - ${errorText}`);
  }

  return res.json();
}
