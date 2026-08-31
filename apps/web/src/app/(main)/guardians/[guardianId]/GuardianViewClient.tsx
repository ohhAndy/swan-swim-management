"use client";

import { useRouter } from "next/navigation";
import { GuardianDetailsCard } from "@/components/guardians/GuardianDetailsCard";
import { GuardianStudentsList } from "@/components/guardians/GuardianStudentsList";
import type { GuardianData } from "@/components/guardians/guardian-view.types";
import { CurrentUser } from "@/lib/auth/user";

export default function GuardianViewClient({
  guardian,
  user,
}: {
  guardian: GuardianData;
  user: CurrentUser;
}) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => router.back()}
          className="hover:text-blue-600 underline"
        >
          Back
        </button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Guardian Profile</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Guardian Info & Notes */}
        <div className="space-y-6 lg:col-span-1">
          <GuardianDetailsCard guardian={guardian} userRole={user.role} />
        </div>

        {/* Right Column: Students & Enrollments */}
        <div className="lg:col-span-2 space-y-6">
          <GuardianStudentsList
            students={guardian.students}
            userRole={user.role}
          />
        </div>
      </div>
    </div>
  );
}
