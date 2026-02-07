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

// Define types for page props
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const terms = await getAllTerms();
  const resolvedSearchParams = await searchParams;
  const requestedTermId = resolvedSearchParams?.termId as string | undefined;

  const now = new Date();

  // Sort terms by startDate descending (newest first)
  const sortedTerms = [...terms].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateB - dateA;
  });

  // 1. Determine which term to show
  let termToUse = requestedTermId
    ? sortedTerms.find((t) => t.id === requestedTermId)
    : undefined;

  // 2. Fallback if no requested term or not found: Current term -> Newest term
  if (!termToUse) {
    const currentTerm = sortedTerms.find((t) => {
      if (!t.startDate || !t.endDate) return false;
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });

    termToUse = currentTerm || sortedTerms[0]; // sortedTerms[0] is newest because of sort
  }

  // 3. Find next and previous terms
  const currentIndex = sortedTerms.findIndex((t) => t.id === termToUse?.id);
  const nextTerm = currentIndex > 0 ? sortedTerms[currentIndex - 1] : null; // Newer term (lower index)
  const prevTerm =
    currentIndex < sortedTerms.length - 1
      ? sortedTerms[currentIndex + 1]
      : null; // Older term (higher index)

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
              <StatsOverview
                termId={termToUse.id}
                termName={termToUse.name}
                prevTermId={prevTerm?.id}
                nextTermId={nextTerm?.id}
              />
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
