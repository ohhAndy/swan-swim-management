import { hasMinRole } from "@/lib/auth/permissions";
import { notFound, redirect } from "next/navigation";
import { isNotFound } from "@/lib/api/error";
import { getStudentById } from "@/lib/api/server/students";
import { getAllTermsUnfiltered } from "@/lib/api/server/schedule";
import { getCurrentUser } from "@/lib/auth/user";
import StudentMakeupsClient from "./StudentMakeupsClient";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) => {
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  return {
    title: `${student.firstName} ${student.lastName} – Make-ups | Swan Swim Management`,
  };
};

export default async function StudentMakeupsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!hasMinRole(user.role, "supervisor")) {
    redirect("/");
  }

  try {
    const [student, terms] = await Promise.all([
      getStudentById(resolvedParams.studentId),
      getAllTermsUnfiltered(),
    ]);

    return <StudentMakeupsClient student={student} terms={terms} user={user} />;
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}
