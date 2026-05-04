"use client";

import { useState } from "react";
import TimeSlots from "./TimeSlotClient";
import { DetailedTimeSlot } from "@/lib/api/schedule";
import { Button } from "@/components/ui/button";
import { BarChart2, List } from "lucide-react";

export default function ScheduleGrid({
  timeSlotsByDay,
  termId,
}: {
  timeSlotsByDay: Record<number, DetailedTimeSlot[]>;
  termId: string;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails((v) => !v)}
          className="gap-2"
        >
          {showDetails ? (
            <>
              <List className="h-4 w-4" />
              Simple View
            </>
          ) : (
            <>
              <BarChart2 className="h-4 w-4" />
              Detailed View
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-1 max-h-[80vh] overflow-y-auto">
        {Array.from({ length: 7 }).map((_, i) => (
          <TimeSlots
            key={i}
            timeSlots={timeSlotsByDay[i] ?? []}
            weekday={i}
            termId={termId}
            showDetails={showDetails}
          />
        ))}
      </div>
    </div>
  );
}
