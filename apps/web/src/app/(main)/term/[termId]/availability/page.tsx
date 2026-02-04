import { Metadata } from "next";
import AvailabilityClientWrapper from "./AvailabilityClient";

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
        <AvailabilityClientWrapper termId={termId} />
      </div>
    </>
  );
}
