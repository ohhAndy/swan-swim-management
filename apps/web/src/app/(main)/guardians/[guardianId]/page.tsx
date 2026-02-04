import { notFound, redirect } from "next/navigation";
import { getGuardianById } from "@/lib/api/guardians";
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

  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager"
  ) {
    redirect("/");
  }

  try {
    const guardian = await getGuardianById(resolvedParams.guardianId);
    return <GuardianViewClient guardian={guardian} user={user} />;
  } catch (error) {
    console.error("Failed to fetch guardian:", error);
    notFound();
  }
}
