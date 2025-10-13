import { notFound, redirect } from "next/navigation";
import { getStudentById } from "@/lib/api/students";
import StudentViewClient from "./StudentViewClient";
import { getCurrentUser } from "@/lib/auth/user";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login')
  }

  try {
    const student = await getStudentById(resolvedParams.studentId);
    return <StudentViewClient student={student} user={user}/>;
  } catch (error) {
    console.error("Failed to fetch student:", error);
    notFound();
  }
}