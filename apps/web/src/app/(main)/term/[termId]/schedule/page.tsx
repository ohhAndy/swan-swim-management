import { getTimeSlotsByWeekday, getTermTitle } from "@/lib/api/schedule";
import TimeSlots from "./TimeSlotClient";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";

export default async function TimeSlotsPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const resolvedParams = await params;
  const { termId } = resolvedParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Only admin and manager can see the full weekly schedule grid
  if (user.role !== "admin" && user.role !== "manager") {
    const today = new Date().toISOString().split("T")[0];
    redirect(`/term/${termId}/schedule/date/${today}`);
  }

  const timeSlotsByDay: Record<number, string[]> = {};

  for (let weekday = 0; weekday < 7; weekday++) {
    const timeSlots: string[] = await getTimeSlotsByWeekday(termId, weekday);
    timeSlotsByDay[weekday] = timeSlots;
  }

  const fetchTitle: string = await getTermTitle(termId);
  const termTitle = fetchTitle === "" ? null : fetchTitle;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-[#1c82c5]">{termTitle} Classes</h1>
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
    </div>
  );
}
