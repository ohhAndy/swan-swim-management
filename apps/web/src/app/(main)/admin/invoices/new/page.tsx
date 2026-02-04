import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import CreateInvoiceForm from "./CreateInvoiceForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Invoice | Swan Swim Management",
};

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <CreateInvoiceForm />
    </div>
  );
}
