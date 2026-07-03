import { clientFetch } from "../_fetch/client";

export interface DashboardStats {
  studentCount: number;
  capacity: {
    total: number;
    filled: number;
    percentage: number;
  };
  studentsPerDay: number[];
  levels: Record<string, number>;
  actionItems: {
    pendingMakeups: number;
    upcomingTrials: number;
  };
}

export async function getDashboardStats(
  termId: string
): Promise<DashboardStats> {
  const res = await clientFetch(`/statistics/dashboard?termId=${termId}`, {
  });

  return res.json();
}
