"use client";

import { useEffect, useState } from "react";
import {
  getRevenueByLocation,
  getRevenueByTerm,
  RevenueByLocation,
  RevenueByTerm,
} from "@/lib/api/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancialsClient() {
  const [loading, setLoading] = useState(true);
  const [revenueByLocation, setRevenueByLocation] = useState<
    RevenueByLocation[]
  >([]);
  const [revenueByTerm, setRevenueByTerm] = useState<RevenueByTerm[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [locData, termData] = await Promise.all([
          getRevenueByLocation(),
          getRevenueByTerm(),
        ]);
        setRevenueByLocation(locData);
        setRevenueByTerm(termData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sky Blue, Green, Yellow/Gold, Orange
  const COLORS = ["#0ea5e9", "#22c55e", "#fad02c", "#f97316"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Financial Insights
        </h1>
        <p className="text-gray-500">
          Overview of revenue performance by location and term.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByLocation}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="locationName" />
                  <YAxis
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `$${(value || 0).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                    shape={(props: unknown) => {
                      const typedProps = props as {
                        index: number;
                        fill?: string;
                      };
                      return (
                        <Rectangle
                          {...typedProps}
                          fill={COLORS[typedProps.index % COLORS.length]}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByTerm}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis type="category" dataKey="termName" width={180} />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `$${(value || 0).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#232F50"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables could go here */}
    </div>
  );
}
