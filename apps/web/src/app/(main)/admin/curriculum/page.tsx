import { CurriculumManager } from "@/components/curriculum/CurriculumManager";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";

export default async function CurriculumPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6">
      <PermissionGate
        allowedRoles={["super_admin", "admin"]}
        currentRole={user?.role}
      >
        <CurriculumManager />
      </PermissionGate>
    </div>
  );
}
