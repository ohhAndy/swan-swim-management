import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { getCurrentUser } from "@/lib/auth/user";
import { getAllTerms } from "@/lib/api/schedule";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Swan Swim Management",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const terms = await getAllTerms();

  const now = new Date();

  // 1. Try to find the *current* term (where today is within range)
  const currentTerm = terms.find((t) => {
    if (!t.startDate || !t.endDate) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    // Include end date fully
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  });

  // 2. Fallback to newest term if no current term
  const newestTerm = [...terms].sort((a, b) => {
    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
    return dateB - dateA;
  })[0];

  const termToUse = currentTerm || newestTerm;

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col min-h-screen items-center justify-start p-4 pt-16">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-[#1c82c5]">
            {user ? `Welcome, ${user.fullName}!` : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-600 mt-4 space-y-4">
          <p className="text-center">Here’s your dashboard overview.</p>

          {termToUse &&
            ["super_admin", "admin", "manager"].includes(user?.role || "") && (
              <StatsOverview termId={termToUse.id} />
            )}

          {termToUse && (
            <div className="pt-4 border-t">
              <Button
                asChild
                variant="outline"
                className="w-full bg-[#1c82c5] hover:bg-[#156a9e] text-white"
              >
                <Link href={`/term/${termToUse.id}/schedule/date/${today}`}>
                  View Today&apos;s Schedule
                </Link>
              </Button>
              <PermissionGate
                allowedRoles={["super_admin", "admin", "manager"]}
                currentRole={user.role}
              >
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-[#1c82c5] hover:bg-[#156a9e] text-white mt-2"
                >
                  <Link href={`/term/${termToUse.id}/availability`}>
                    View Availability
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
