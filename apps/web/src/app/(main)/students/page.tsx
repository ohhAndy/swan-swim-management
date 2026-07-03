import { searchStudents } from "@/lib/api/server/students";
import StudentsListClient from "./StudentListClient";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Students | Swan Swim Management",
};

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    page?: string;
    enrollmentStatus?: string;
    level?: string;
  }>;
}) {
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

  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const page = parseInt(resolvedParams.page || "1");
  const enrollmentStatus = resolvedParams.enrollmentStatus || "";
  const level = resolvedParams.level || "";

  const studentsData = await searchStudents({
    query,
    page,
    pageSize: 20,
    enrollmentStatus,
    level,
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading students...</div>}>
        <StudentsListClient
          initialData={studentsData}
          initialQuery={query}
          user={user}
        />
      </Suspense>
    </div>
  );
}

