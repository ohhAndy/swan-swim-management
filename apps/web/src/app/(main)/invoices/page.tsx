import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import InvoicesListClient from "./InvoicesListClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only admin and manager can access invoices
  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager"
  ) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8">
      <InvoicesListClient />
    </div>
  );
}
