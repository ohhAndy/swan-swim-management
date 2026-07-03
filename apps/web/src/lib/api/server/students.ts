import { CreateStudentInput } from "../../zod/student";
import { serverFetch } from "../_fetch/server";

export type StudentLite = {
  id: string;
  firstName: string;
  lastName: string;
  shortCode: string | null;
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

  const res = await serverFetch(`/students?${searchParams.toString()}`);
  return res.json();
}

export async function createStudent(input: CreateStudentInput) {
  const res = await serverFetch(`/students`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function getStudentById(studentId: string) {
  const res = await serverFetch(`/students/${studentId}`);
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
  },
) {
  const res = await serverFetch(`/students/${studentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.json();
}
