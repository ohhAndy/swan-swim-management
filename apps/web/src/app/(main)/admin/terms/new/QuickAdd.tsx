"use client";

import { useState, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormInput, TemplateInput } from "@/lib/zod/term";
import {
  WEEKDAY_SLOTS,
  WEEKEND_SLOTS,
  laneLetter,
} from "@/lib/schedule/slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuickAdd({ form }: { form: UseFormReturn<FormInput> }) {
  const [baseTitle, setBaseTitle] = useState("Beginner 1");
  const [duration, setDuration] = useState(45);
  const [capacity, setCapacity] = useState(3);
  const [lanes, setLanes] = useState(3);

  const weekdayDays = useMemo(() => [1, 2, 3, 4, 5], []);
  const weekendDays = useMemo(() => [0, 6], []);

  function bulkAdd(days: number[], times: string[]) {
    const rows: TemplateInput[] = [];
    for (const weekday of days) {
      for (const startTime of times) {
        for (let l = 0; l < lanes; l++) {
          rows.push({
            title: `${baseTitle} - Class ${laneLetter(l)}`,
            weekday,
            startTime,
            duration,
            capacity,
            notes: "",
          });
        }
      }
    }
    form.setValue(
      "templates",
      [...(form.getValues("templates") ?? []), ...rows],
      { shouldValidate: true, shouldDirty: true }
    );
  }

  return (
    <div className="rounded-md border bg-slate-50 p-4 flex flex-col gap-4">
      <h2 className="mb-3 text-lg font-medium">Quick add offerings</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div>
          <Label>Base title</Label>
          <Input
            value={baseTitle}
            onChange={(e) => setBaseTitle(e.target.value)}
          />
        </div>
        <div>
          <Label>Duration (min)</Label>
          <Input
            type="number"
            min={15}
            max={240}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Capacity</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Lanes</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={lanes}
            onChange={(e) => setLanes(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 ">
        <Button
          type="button"
          variant="outline"
          onClick={() => bulkAdd(weekdayDays, WEEKDAY_SLOTS)}
        >
          + Weekdays (Mon–Fri)
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => bulkAdd(weekendDays, WEEKEND_SLOTS)}
        >
          + Weekend (Sat–Sun)
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Edit the preset times in <code>src/lib/schedule/slots.ts</code> to match
        your school.
      </p>
    </div>
  );
}
