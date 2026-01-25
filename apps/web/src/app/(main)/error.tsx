"use client";

import { useEffect } from "react";
import AccessDeniedPage from "@/app/access-denied/page";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  // Check if the error message contains "Access denied" or is a 403
  // Note: API client throws "Error: ... Access denied ..."
  if (
    error.message.includes("Access denied") ||
    error.message.toLowerCase().includes("forbidden") ||
    (error as Error & { status?: number }).status === 403
  ) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
