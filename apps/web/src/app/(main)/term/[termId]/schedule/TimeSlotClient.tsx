"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FULL_DAY_LABELS, formatTimeRange } from "@/lib/schedule/slots";
import { AddClassDialog } from "@/components/schedule/AddClassDialog";

import Link from "next/link";

export default function TimeSlots({
  timeSlots,
  weekday,
  termId,
}: {
  timeSlots: string[];
  weekday: number;
  termId: string;
}) {
  const getDuration = (timeSlot: string) => {
    const [start, end] = timeSlot.split("-");
    if (!start || !end) return 0;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    return h2 * 60 + m2 - (h1 * 60 + m1);
  };

  return (
    <Card className="w-full rounded-sm">
      <CardHeader className="text-lg font-semibold text-center font-fredoka">
        <CardTitle>{FULL_DAY_LABELS[weekday]}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 items-center">
          {timeSlots.map((t, i) => (
            <Button
              key={i}
              asChild
              variant="ghost"
              className="w-full flex rounded-md hover:bg-muted transition cursor-pointer"
            >
              <Link
                href={`/term/${termId}/schedule/weekday/${weekday}/slot/${timeSlots[i]}`}
              >
                <span
                  className={`text-center align-middle text-sm ${
                    getDuration(t) === 30
                      ? "text-yellow-600 font-medium"
                      : getDuration(t) === 45
                        ? "text-[#1c82c5]"
                        : "text-green-600 font-medium"
                  }`}
                >
                  {formatTimeRange(t)}
                </span>
              </Link>
            </Button>
          ))}
          <AddClassDialog termId={termId} weekday={weekday} />
        </div>
      </CardContent>
    </Card>
  );
}
