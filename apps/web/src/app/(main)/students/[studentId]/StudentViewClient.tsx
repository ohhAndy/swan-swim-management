"use client";

import { useRouter } from "next/navigation";
import { StudentInfoCard } from "@/components/students/StudentInfoCard";
import { StudentGuardianCard } from "@/components/students/StudentGuardianCard";
import { StudentQuickLinksCard } from "@/components/students/StudentQuickLinksCard";
import { StudentEnrollmentsList } from "@/components/students/StudentEnrollmentsList";
import type { Student } from "@/lib/types/models";
import { CurrentUser } from "@/lib/auth/user";

export default function StudentViewClient({
  student,
  user,
}: {
  student: Student;
  user: CurrentUser;
}) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => router.push("/students")}
          className="hover:text-blue-600 underline"
        >
          Students
        </button>
        <span>/</span>
        <span className="text-gray-900">
          {student.firstName} {student.lastName}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student Profile Information */}
        <div className="lg:col-span-2">
          <StudentInfoCard student={student} userRole={user.role} />
        </div>

        {/* Guardian Information */}
        <div>
          <StudentGuardianCard
            guardian={student.guardian}
            userRole={user.role}
          />
        </div>

        {/* Quick Links */}
        <div>
          <StudentQuickLinksCard student={student} />
        </div>
      </div>

      {/* Enrollment History */}
      <StudentEnrollmentsList
        student={student}
        userRole={user.role}
        staffUserId={user.staffUserId}
      />
    </div>
  );
}
