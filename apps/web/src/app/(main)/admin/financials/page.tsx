import { hasMinRole } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import FinancialsClient from "./FinancialsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financials | Swan Swim Management",
};

export default async function FinancialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!hasMinRole(user.role, "admin")) {
    redirect("/");
  }

  return <FinancialsClient />;
}
