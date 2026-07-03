import { CreateStudentInput } from "../../zod/student";
import { clientFetch } from "../_fetch/client";

export type StudentLite = {
  id: string;
  firstName: string;
  lastName: string;
  shortCode: string | null;
  level: string | null;
  birthdate: string | null;
};

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

  const res = await clientFetch(`/students?${searchParams.toString()}`, {
    cache: "no-store",
  });
  return res.json();
}

export async function createStudent(input: CreateStudentInput) {
  const res = await clientFetch(`/students`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateStudent(
  studentId: string,
  data: {
    firstName?: string;
    lastName?: string;
    shortCode?: string | null;
    level?: string | null;
    levelId?: string | null;
    birthdate?: string | null;
  },
) {
  const res = await clientFetch(`/students/${studentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getStudentById(studentId: string) {
  const res = await clientFetch(`/students/${studentId}`, { cache: "no-store" });
  return res.json();
}

export async function updateStudentNotes(studentId: string, notes: string) {
  const res = await clientFetch(`/students/${studentId}/notes`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
  return res.json();
}

export async function deleteStudent(studentId: string) {
  const res = await clientFetch(`/students/${studentId}`, { method: "DELETE" });
  return res.json();
}
