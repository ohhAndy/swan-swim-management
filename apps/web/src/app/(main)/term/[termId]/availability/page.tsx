import { Metadata } from "next";
import AvailabilityClientWrapper from "./AvailabilityClient";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Availability | Swan Swim Management",
};

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const resolvedParams = await params;
  const { termId } = resolvedParams;
  return (
    <>
      <div className="min-h-screen bg-background">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading availability...</div>
          </div>
        }>
          <AvailabilityClientWrapper termId={termId} />
        </Suspense>
      </div>
    </>
  );
}

