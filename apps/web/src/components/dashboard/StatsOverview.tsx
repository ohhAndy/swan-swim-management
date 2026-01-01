"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardStats, getDashboardStats } from "@/lib/api/stats";
import { Users, AlertCircle, CalendarClock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsOverview({ termId }: { termId: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats(termId);
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (termId) {
      fetchStats();
    }
  }, [termId]);

  if (loading) {
    return <StatsSkeleton />;
  }

  if (!stats) return null;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxStudentsPerDay = Math.max(...stats.studentsPerDay, 1);

  return (
    <div className="space-y-6 mb-8 w-full text-left">
      <h2 className="text-xl font-semibold text-gray-800">Term Overview</h2>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.capacity.filled}</div>
            <p className="text-xs text-muted-foreground">
              {stats.capacity.percentage}% of capacity filled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Trials
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.actionItems.upcomingTrials}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Makeups
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.actionItems.pendingMakeups}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Popular Level
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {Object.entries(stats.levels).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0] || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest active enrollment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Capacity Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Enrollment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
                <span className="font-medium">Term Capacity</span>
                <span className="text-muted-foreground">
                  {stats.capacity.filled} / {stats.capacity.total}
                </span>
              </div>
              <Progress value={stats.capacity.percentage} className="h-2" />
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4">
              {/* Simplified level grouping if multiple levels exist */}
              {Object.entries(stats.levels)
                .slice(0, 6)
                .map(([level, count]) => (
                  <div
                    key={level}
                    className="flex justify-between items-center text-sm border-b pb-2"
                  >
                    <span
                      className="text-gray-600 truncate mr-2 flex-1"
                      title={level}
                    >
                      {level}
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Load Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Student Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-[200px] space-x-2">
              {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                const count = stats.studentsPerDay[dayIndex];
                const heightPercentage = Math.max(
                  (count / maxStudentsPerDay) * 100,
                  4
                ); // min height for visibility
                return (
                  <div
                    key={dayIndex}
                    className="flex flex-col items-center w-full h-full"
                  >
                    <div className="flex-1 w-full flex items-end justify-center pb-2">
                      <div
                        className="w-full bg-blue-100 rounded-t-md hover:bg-blue-200 transition-colors"
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs text-muted-foreground font-medium">
                        {days[dayIndex].substring(0, 3)}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6 mb-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 grid-cols-7">
        <Skeleton className="col-span-3 h-64 rounded-xl" />
        <Skeleton className="col-span-4 h-64 rounded-xl" />
      </div>
    </div>
  );
}
