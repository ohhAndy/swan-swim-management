import { getDailySchedule, getAllTerms } from "@/lib/api/schedule";

import DailyScheduleClient from "./DailyScheduleClient";

import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Schedule | Swan Swim Management",
};

export default async function DailySchedulePage({
  params,
}: {
  params: Promise<{ termId: string; date: string }>;
}) {
  const user = await getCurrentUser();
  if (
    !user ||
    !["super_admin", "admin", "manager", "supervisor"].includes(user.role)
  ) {
    redirect("/");
  }

  const resolvedParams = await params;
  const { termId, date } = resolvedParams;

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
