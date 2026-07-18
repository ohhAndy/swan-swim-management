import { notFound, redirect } from "next/navigation";
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

  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager" &&
    user.role !== "supervisor"
  ) {
    redirect("/");
  }

  try {
    const [student, terms] = await Promise.all([
      getStudentById(resolvedParams.studentId),
      getAllTermsUnfiltered(),
    ]);

    return (
      // getAllTerms() is typed as Prisma Term[] (with Date fields), but JSON.parse gives strings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <StudentMakeupsClient student={student} terms={terms as unknown as any} user={user} />
    );
  } catch (error) {
    console.error("Failed to fetch student makeups:", error);
    notFound();
  }
}
