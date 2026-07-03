import { searchGuardiansPage } from "@/lib/api/client/guardian";
import GuardianListClient from "./GuardianListClient";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { getServerAuthHeaders } from "@/lib/api/server-headers";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Guardians | Swan Swim Management",
};

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

  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager"
  ) {
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
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading guardians...</div>}>
        <GuardianListClient
          initialData={guardiansData}
          initialQuery={query}
          user={user}
        />
      </Suspense>
    </div>
  );
}

