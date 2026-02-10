"use client";

import { useEffect, useState } from "react";
import {
  getTermFinancialDetails,
  TermFinancialDetails,
} from "@/lib/api/analytics";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TermFinancialsClientProps {
  termId: string;
}

export default function TermFinancialsClient({
  termId,
}: TermFinancialsClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TermFinancialDetails | null>(null);
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching term details for", termId, "date:", date);
        const startDate = date?.from
          ? format(date.from, "yyyy-MM-dd")
          : undefined;
        const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : undefined;
        const result = await getTermFinancialDetails(
          termId,
          startDate,
          endDate,
        );
        console.log("Term details result:", result);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch term details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [termId, date]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load data.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/financials">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Term Financials
          </h1>
          <p className="text-gray-500">
            Detailed revenue breakdown for this term.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Card className="w-fit">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${data.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {date?.from && (
            <Button
              variant="ghost"
              onClick={() => setDate({ from: undefined, to: undefined })}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Revenue by Weekday</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-[400px] w-full"
              style={{ width: "100%", height: 400 }}
            >
              {data.revenueByWeekday.length > 0 && mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={data.revenueByWeekday}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `$${(Number(value) || 0).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No revenue data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Revenue by Offering</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-[400px] w-full"
              style={{ width: "100%", height: 400 }}
            >
              {data.revenueByProgram.length > 0 && mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={data.revenueByProgram}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `$${(Number(value) || 0).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No breakdown available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
