import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/user";
import { getAllTerms } from "@/lib/api/schedule";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const terms = await getAllTerms();

  // Sort terms by end date descending to get the latest one
  const latestTerm = terms.sort((a, b) => {
    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
    return dateB - dateA;
  })[0];

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-[#1c82c5]">
            {user ? `Welcome, ${user.fullName}!` : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-600 mt-4 space-y-4">
          <p>Here’s your dashboard overview.</p>

          {latestTerm && (
            <div className="pt-4 border-t">
              <Button
                asChild
                variant="outline"
                className="w-full bg-[#1c82c5] hover:bg-[#156a9e] text-black"
              >
                <Link href={`/term/${latestTerm.id}/schedule/date/${today}`}>
                  View Today&apos;s Schedule
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
