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

// Lazy load or import
import AvailabilityClientWrapper from "./AvailabilityClient";
