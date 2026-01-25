import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">
          You do not have permission to view this page at this time based on
          your scheduled work hours.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/login">
            <Button>Log In with Different Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
