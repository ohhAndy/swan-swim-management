import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import UninvoicedList from "./UninvoicedList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uninvoiced Enrollments | Swan Swim Management",
};

export const dynamic = "force-dynamic";

export default async function UninvoicedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only admin and manager can access
  if (
    user.role !== "super_admin" &&
    user.role !== "admin" &&
    user.role !== "manager"
  ) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8">
      <UninvoicedList />
    </div>
  );
}
