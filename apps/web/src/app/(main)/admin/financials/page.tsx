import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import FinancialsClient from "./FinancialsClient";

export default async function FinancialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "super_admin" && user.role !== "admin") {
    redirect("/");
  }

  return <FinancialsClient />;
}
