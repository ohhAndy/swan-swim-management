import { hasMinRole } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import TermFinancialsClient from "./TermFinancialsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TermFinancialsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!hasMinRole(user.role, "admin")) {
    redirect("/");
  }

  const resolvedParams = await params;

  return <TermFinancialsClient termId={resolvedParams.id} />;
}
