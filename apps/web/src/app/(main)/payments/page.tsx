import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import PaymentHistoryClient from "./PaymentHistoryClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#1c82c5]">
          Payment History
        </h1>
      </div>
      <PaymentHistoryClient />
    </div>
  );
}
