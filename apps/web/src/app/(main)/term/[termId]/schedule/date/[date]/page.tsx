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

  // Fetch all terms to find current and next
  const allTerms = await getAllTerms();
  // Sort by start date just in case
  allTerms.sort(
    (a, b) =>
      new Date(a.startDate || "").getTime() -
      new Date(b.startDate || "").getTime(),
  );

  const currentTerm = allTerms.find((t) => t.id === termId);
  const currentTermIndex = allTerms.findIndex((t) => t.id === termId);
  const nextTerm =
    currentTermIndex < allTerms.length - 1
      ? allTerms[currentTermIndex + 1]
      : null;
  const prevTerm = currentTermIndex > 0 ? allTerms[currentTermIndex - 1] : null;

  if (locationId) {
    if (!currentTerm) {
      redirect("/term");
    }

    if (currentTerm.locationId && currentTerm.locationId !== locationId) {
      redirect("/term");
    }
  }

  const data = await getDailySchedule(termId, date);

  // Auto-redirect to term start date if no classes found for this date
  // AND if the current date is NOT the start date (to avoid infinite loop if start date itself has no classes)
  // Note: ideally we'd find the first date WITH classes, but start date is a safe fallback
  if (
    data.classes.length === 0 &&
    currentTerm &&
    currentTerm.startDate &&
    date !== String(currentTerm.startDate).split("T")[0]
  ) {
    redirect(
      `/term/${termId}/schedule/date/${
        String(currentTerm.startDate).split("T")[0]
      }`,
    );
  }

  return (
    <DailyScheduleClient
      data={data}
      termId={termId}
      date={date}
      userRole={user.role}
      nextTermId={nextTerm?.id}
      nextTermStartDate={
        nextTerm?.startDate
          ? String(nextTerm.startDate).split("T")[0]
          : undefined
      }
      prevTermId={prevTerm?.id}
      prevTermStartDate={
        prevTerm?.startDate
          ? String(prevTerm.startDate).split("T")[0]
          : undefined
      }
    />
  );
}
