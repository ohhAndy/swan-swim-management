import {
  getTimeSlotsByWeekday,
  getTermTitle,
  getAllTerms,
  getFlexibleSchedule,
} from "@/lib/api/schedule";
import TimeSlots from "./TimeSlotClient";
import { groupByOffering } from "@/lib/schedule/transform";
import { SlotBlock } from "@/components/schedule/SlotBlock";
import { AddFlexibleClassDialog } from "@/components/schedule/AddFlexibleClassDialog";
import { getCurrentUser } from "@/lib/auth/user";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule | Swan Swim Management",
};

export default async function TimeSlotsPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const resolvedParams = await params;
  const { termId } = resolvedParams;

  // Location Guard
  const cookieStore = await cookies();
  const locationId = cookieStore.get("swan_location_id")?.value;

  if (locationId) {
    const allTerms = await getAllTerms();
    const currentTerm = allTerms.find((t) => t.id === termId);

    if (!currentTerm) {
      redirect("/term");
    }

    if (currentTerm.locationId && currentTerm.locationId !== locationId) {
      redirect("/term");
    }
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Only admin and manager can see the full weekly schedule grid
  if (!["super_admin", "admin", "manager"].includes(user.role)) {
    // Other roles shouldn't see full grid, just redirect to today's schedule
    const today = new Date().toISOString().split("T")[0];
    redirect(`/schedule/date/${today}`);
  }

  const weekdayPromises = Array.from({ length: 7 }).map((_, weekday) =>
    getTimeSlotsByWeekday(termId, weekday),
  );

  const [fetchTitle, flexibleSchedule, ...weeklySlots] = await Promise.all([
    getTermTitle(termId),
    getFlexibleSchedule(termId).catch(() => null),
    ...weekdayPromises,
  ]);

  const flexibleBlocks = flexibleSchedule ? groupByOffering(flexibleSchedule) : [];

  const timeSlotsByDay: Record<number, string[]> = {};
  weeklySlots.forEach((slots, index) => {
    timeSlotsByDay[index] = slots;
  });
  const termTitle = fetchTitle === "" ? null : fetchTitle;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold text-[#1c82c5]">{termTitle}</h1>
        <div className="flex gap-4 text-sm items-center">
          <PermissionGate
            allowedRoles={["super_admin", "admin"]}
            currentRole={user.role}
          >
            <AddFlexibleClassDialog termId={termId} />
          </PermissionGate>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-3 h-3 rounded-full bg-yellow-600" />
            <span>P&T</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1c82c5]" />
            <span>Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span>Swim Team</span>
          </div>
        </div>
      </div>
      {flexibleBlocks.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-1 max-h-[80vh] overflow-y-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <TimeSlots
              key={i}
              timeSlots={timeSlotsByDay[i]}
              weekday={i}
              termId={termId}
            />
          ))}
        </div>
      )}

      {flexibleBlocks.length > 0 && (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-xl font-bold text-[#1c82c5]">Flexible / Short Courses</h2>
          <div className="grid gap-5">
            {flexibleBlocks.map((b) => (
              <SlotBlock
                key={b.offeringKey}
                title={b.title}
                isoDates={Array.from(new Set(b.rosters.map((r) => r.session.date.slice(0, 10) + "T04:00:00.000Z"))).sort()}
                rosters={b.rosters}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
