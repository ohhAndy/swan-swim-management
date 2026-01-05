import { getDailySchedule } from "@/lib/api/schedule";

import DailyScheduleClient from "./DailyScheduleClient";

import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";

export default async function DailySchedulePage({
  params,
}: {
  params: Promise<{ termId: string; date: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !["admin", "manager", "supervisor"].includes(user.role)) {
    redirect("/");
  }

  const resolvedParams = await params;
  const { termId, date } = resolvedParams;
  const data = await getDailySchedule(termId, date);

  return (
    <DailyScheduleClient
      data={data}
      termId={termId}
      date={date}
      userRole={user.role}
    />
  );
}
