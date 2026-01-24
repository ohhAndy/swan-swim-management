"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTermAvailability, getTermTitle } from "@/lib/api/schedule-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/nav/BackButton";

type AvailabilityData = Record<
  number,
  Array<{
    offeringId: string;
    title: string;
    time: string;
    capacity: number;
    sessions: Array<{
      date: string;
      openSeats: number;
    }>;
    instructors: string[];
  }>
>;

export default function AvailabilityClient({ termId }: { termId: string }) {
  const router = useRouter();
  const [level, setLevel] = useState<string>("all");
  const [weekday, setWeekday] = useState<string>("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [termName, setTermName] = useState("");
  const [selectedTime, setSelectedTime] = useState<string>("all");

  const allLevels = ["PS", "SW", "Adult"];

  useEffect(() => {
    getTermTitle(termId).then(setTermName).catch(console.error);
  }, [termId]);

  useEffect(() => {
    setSelectedTime("all");
    setSelectedInstructor("all");
  }, [weekday]);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await getTermAvailability(
          termId,
          level === "all" ? undefined : level,
          weekday === "all" ? undefined : Number(weekday),
        );
        setData(res);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        toast.error("Failed to fetch availability");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [termId, level, weekday]);

  const weekdays = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat

  const isSingleDay = weekday !== "all";

  // Compute unique instructors from loaded data
  const allInstructors = new Set<string>();
  if (data) {
    Object.values(data).forEach((classes) => {
      classes.forEach((c) => {
        c.instructors.forEach((i) => allInstructors.add(i));
      });
    });
  }
  const uniqueInstructors = Array.from(allInstructors).sort();

  return (
    <main className="p-4 md:p-6 pb-20 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BackButton fallbackHref={`/term/${termId}/schedule`} />
            <h1 className="text-2xl font-bold tracking-tight">Open Slots</h1>
          </div>
          <p className="text-muted-foreground">
            {termName} - Showing classes with availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {weekdays.map((wd) => (
                <SelectItem key={wd} value={wd.toString()}>
                  {FULL_DAY_LABELS[wd]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {allLevels.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedInstructor}
            onValueChange={setSelectedInstructor}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {uniqueInstructors.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !data || Object.keys(data).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
          <p>No available classes found for the selected usage.</p>
        </div>
      ) : (
        <div
          className={
            isSingleDay
              ? "space-y-4"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }
        >
          {weekdays.map((wd) => {
            const dayClasses = data[wd];
            if (!dayClasses || dayClasses.length === 0) return null;

            // Extract unique sorted times if viewing a single day
            const uniqueTimes = isSingleDay
              ? Array.from(new Set(dayClasses.map((c) => c.time))).sort(
                  (a, b) => {
                    return (
                      new Date("1970/01/01 " + a).getTime() -
                      new Date("1970/01/01 " + b).getTime()
                    );
                  },
                )
              : [];

            const displayedClasses =
              isSingleDay && selectedTime !== "all"
                ? dayClasses.filter(
                    (c) =>
                      c.time === selectedTime &&
                      (selectedInstructor === "all" ||
                        c.instructors.includes(selectedInstructor)),
                  )
                : dayClasses.filter(
                    (c) =>
                      selectedInstructor === "all" ||
                      c.instructors.includes(selectedInstructor),
                  );

            return (
              <div key={wd} className="space-y-3">
                <h3 className="font-semibold text-lg bg-muted/50 p-2 rounded text-center">
                  {FULL_DAY_LABELS[wd]}
                </h3>

                {isSingleDay && (
                  <div className="flex justify-center pb-2">
                    <Tabs value={selectedTime} onValueChange={setSelectedTime}>
                      <TabsList className="flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="all">All Times</TabsTrigger>
                        {uniqueTimes.map((time) => (
                          <TabsTrigger key={time} value={time}>
                            {time}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                )}
                <div
                  className={
                    isSingleDay
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-3"
                  }
                >
                  {displayedClasses.map((cls) => (
                    <Card key={cls.offeringId} className="overflow-hidden">
                      <CardHeader className="p-3 bg-blue-50/50 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-medium leading-tight">
                              {cls.title}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 font-mono">
                              {cls.time}
                            </CardDescription>
                          </div>
                          <div className="text-xs bg-white px-1.5 py-0.5 rounded border shadow-sm">
                            Cap: {cls.capacity}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y text-sm max-h-48 overflow-y-auto">
                          {cls.sessions.map((sess) => (
                            <div
                              key={sess.date}
                              className="p-2 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() =>
                                router.push(
                                  `/term/${termId}/schedule/weekday/${wd}/slot/${cls.time}`,
                                )
                              }
                            >
                              <span>
                                {new Date(
                                  sess.date + "T12:00:00Z",
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                                {sess.openSeats} left
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
