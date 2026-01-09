import { searchGuardiansPage } from "@/lib/api/guardian-client";
import GuardianListClient from "./GuardianListClient";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { getServerAuthHeaders } from "@/lib/api/server-headers";

export const dynamic = "force-dynamic";

export default async function GuardiansPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    page?: string;
    waiverStatus?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Consistent with StudentsPage, restrict access to admin/manager for now
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const page = parseInt(resolvedParams.page || "1");
  const waiverStatusParam = resolvedParams.waiverStatus;
  const waiverStatus = (
    waiverStatusParam === "signed" || waiverStatusParam === "pending"
      ? waiverStatusParam
      : undefined
  ) as "signed" | "pending" | undefined;

  const headers = await getServerAuthHeaders();
  const guardiansData = await searchGuardiansPage(query, page, 20, {
    headers,
    waiverStatus,
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <GuardianListClient
        initialData={guardiansData}
        initialQuery={query}
        initialPage={page}
        initialWaiverStatus={waiverStatus}
        user={user}
      />
    </div>
  );
}
