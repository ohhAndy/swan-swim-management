import { hasMinRole } from "@/lib/auth/permissions";
import { notFound, redirect } from "next/navigation";
import { isNotFound } from "@/lib/api/error";
import { getGuardianById } from "@/lib/api/server/guardians";
import GuardianViewClient from "./GuardianViewClient";
import { getCurrentUser } from "@/lib/auth/user";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guardian Details | Swan Swim Management",
};

export default async function GuardianPage({
  params,
}: {
  params: Promise<{ guardianId: string }>;
}) {
  const resolvedParams = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!hasMinRole(user.role, "manager")) {
    redirect("/");
  }

  try {
    const guardian = await getGuardianById(resolvedParams.guardianId);
    return <GuardianViewClient guardian={guardian} user={user} />;
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}
