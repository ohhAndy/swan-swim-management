import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import InvoiceDetailClient from "./InvoiceDetailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Details | Swan Swim Management",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
    redirect("/invoices");
  }

  const resolvedParams = await params;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <InvoiceDetailClient invoiceId={resolvedParams.id} userRole={user.role} />
    </div>
  );
}
