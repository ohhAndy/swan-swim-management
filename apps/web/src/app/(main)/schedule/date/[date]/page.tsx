import { getDailySchedule } from "@/lib/api/schedule";

import DailyScheduleClient from "./DailyScheduleClient";

import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Schedule | Swan Swim Management",
};

export default async function DailySchedulePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const user = await getCurrentUser();
  if (
    !user ||
    !["super_admin", "admin", "manager", "supervisor"].includes(user.role)
  ) {
    redirect("/");
  }

  const resolvedParams = await params;
  const { date } = resolvedParams;

  const data = await getDailySchedule(date);

  return (
    <DailyScheduleClient
      data={data}
      date={date}
      userRole={user.role}
    />
  );
}
