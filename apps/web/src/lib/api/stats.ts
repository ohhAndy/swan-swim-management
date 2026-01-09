import { getHeaders } from "./headers";

const API = process.env.NEXT_PUBLIC_API_URL!;

export interface DashboardStats {
  activeStudents: number;
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
  const headers = await getHeaders();
  const res = await fetch(`${API}/statistics/dashboard?termId=${termId}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return res.json();
}
