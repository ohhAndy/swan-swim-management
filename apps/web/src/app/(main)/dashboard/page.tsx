import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-[#1c82c5]">
            {user ? `Welcome, ${user.fullName}!` : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-600 mt-4">
          <p>Here’s your dashboard overview.</p>
          <p className="mt-2">
            You can manage your schedule, view classes, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
