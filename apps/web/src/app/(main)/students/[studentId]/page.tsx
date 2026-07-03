import { notFound, redirect } from "next/navigation";
import { getStudentById } from "@/lib/api/server/students";
import StudentViewClient from "./StudentViewClient";
import { getCurrentUser } from "@/lib/auth/user";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) => {
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  return {
    title: `${student.firstName} ${student.lastName} | Swan Swim Management`,
  };
};

export default async function StudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager" &&
    user.role !== "supervisor"
  ) {
    redirect("/");
  }

  try {
    const student = await getStudentById(resolvedParams.studentId);
    return <StudentViewClient student={student} user={user} />;
  } catch (error) {
    console.error("Failed to fetch student:", error);
    notFound();
  }
}
