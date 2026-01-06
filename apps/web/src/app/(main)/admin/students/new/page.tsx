import { getCurrentUser } from "@/lib/auth/user";
import NewStudentForm from "./NewStudentForm";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewTermPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.role, "createStudents")) {
    redirect("/forbidden");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Create Student</h1>
      <NewStudentForm />
    </main>
  );
}
