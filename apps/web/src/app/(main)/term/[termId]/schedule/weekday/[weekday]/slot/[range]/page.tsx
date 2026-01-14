import { getSlotPage } from "@/lib/api/schedule";
import { weekdayName, groupByOffering } from "@/lib/schedule/transform";
import type { SlotPage } from "@school/shared-types";
import { SlotHeader } from "@/components/schedule/SlotHeader";
import { SlotBlock } from "@/components/schedule/SlotBlock";
import { BackButton } from "@/components/nav/BackButton";
import NextButton from "@/components/nav/NextButton";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { AddClassDialog } from "@/components/schedule/AddClassDialog";
import { PermissionGate } from "@/components/auth/PermissionGate";

function parseRange(range: string) {
  const [start, end] = decodeURIComponent(range).split("-");
  return { start, end };
}

export default async function SlotPageView({
  params,
}: {
  params: Promise<{ weekday: string; termId: string; range: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const { weekday, termId, range } = resolvedParams;
  const { start, end } = parseRange(range);

  // Calculate duration
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const duration = eh * 60 + em - (sh * 60 + sm);

  const data: SlotPage = await getSlotPage(termId, Number(weekday), start, end);

  const title = `${weekdayName(data.meta.weekday)} - ${data.meta.startTime} - ${
    data.meta.endTime
  }`;
  const subtitle = data.meta.term?.name ?? null;

  const isoDates = data.days.map((d) => d.date);
  const blocks = groupByOffering(data);

  return (
    <main className="p-6 print:p-0">
      <div className="mb-3 flex items-center justify-between">
        <BackButton fallbackHref={`/term/${termId}/schedule`} />
        <NextButton
          baseHref={`/term/${termId}/schedule`}
          weekday={Number(weekday)}
          slotTime={decodeURIComponent(range)}
          termId={termId}
        />
      </div>
      <SlotHeader title={title} subtitle={subtitle}>
        <PermissionGate
          allowedRoles={["admin", "manager"]}
          currentRole={user.role}
        >
          <AddClassDialog
            termId={termId}
            weekday={Number(weekday)}
            startTime={start}
            duration={duration}
          />
        </PermissionGate>
      </SlotHeader>
      <div className="grid gap-5 print:block">
        {blocks.map((b) => (
          <SlotBlock
            key={b.offeringKey}
            title={b.title}
            isoDates={isoDates}
            rosters={b.rosters}
            user={user}
            gridHeaderTop="128px"
          />
        ))}
      </div>
    </main>
  );
}
