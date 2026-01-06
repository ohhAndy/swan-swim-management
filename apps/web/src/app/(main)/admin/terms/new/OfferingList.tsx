"use client";

import {
  type UseFieldArrayReturn,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";
import type { FormInput } from "@/lib/zod/term";
import { Button } from "@/components/ui/button";
import OfferingRow from "./OfferingRow";
import { useCallback, useMemo, useState } from "react";
import { DAY_LABELS } from "@/lib/schedule/slots";

export default function OfferingList({
  form,
  fieldArray,
}: {
  form: UseFormReturn<FormInput>;
  fieldArray: UseFieldArrayReturn<FormInput, "templates", "id">;
}) {
  const { fields, append, remove } = fieldArray;

  const [collapsedDay, setCollapsedDay] = useState<Record<number, boolean>>({});
  const [collapsedTime, setCollapsedTime] = useState<Record<string, boolean>>(
    {}
  );

  const toggleAllDays = (collapse: boolean) => {
    const map: Record<number, boolean> = {};
    for (let i = 0; i < 7; i++) {
      map[i] = collapse;
    }
    setCollapsedDay(map);
  };

  const templates = useWatch({ control: form.control, name: "templates" });

  const grouped = useMemo(() => {
    const rows = fields.map((f, i) => ({
      index: i,
      fieldId: f.id,
      weekday: Number(templates?.[i]?.weekday ?? 1),
      startTime: String(templates?.[i]?.startTime ?? ""),
    }));

    const byDay: Record<
      number,
      { index: number; fieldId: string; startTime: string }[]
    > = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const r of rows) {
      byDay[r.weekday].push({
        index: r.index,
        fieldId: r.fieldId,
        startTime: r.startTime,
      });
    }

    return Array.from({ length: 7 }, (_, day) => {
      const dayRows = byDay[day];
      const byTime: Record<string, { index: number; fieldId: string }[]> = {};
      for (const r of dayRows) {
        (byTime[r.startTime] ??= []).push({
          index: r.index,
          fieldId: r.fieldId,
        });
      }

      //sort key pair values then map them to an obj
      const timeGroups = Object.entries(byTime)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([startTime, rows]) => ({ startTime, rows }));

      return { day, total: dayRows.length, times: timeGroups };
    });
  }, [fields, templates]);

  const addOne = useCallback(
    (defaults?: Partial<FormInput["templates"][number]>) => {
      append({
        title: defaults?.title ?? "",
        weekday: defaults?.weekday ?? 1,
        startTime: defaults?.startTime ?? "09:30",
        duration: defaults?.duration ?? 45,
        capacity: defaults?.capacity ?? 3,
        notes: defaults?.notes ?? "",
      });
    },
    [append]
  );

  const addForDay = (weekday: number) => addOne({ weekday });
  const addForDayTime = (weekday: number, startTime: string) =>
    addOne({ weekday, startTime });
  const timeKey = (weekday: number, startTime: string) =>
    `${weekday}__${startTime}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Class offerings</h2>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => toggleAllDays(true)}
          >
            Collapse all days
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toggleAllDays(false)}
          >
            Expand all days
          </Button>
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-slate-500">
          No offerings yet. Use Quick add or create manually.
        </p>
      )}

      {grouped.map(({ day, total, times }) => {
        if (total === 0) {
          return (
            <div key={`day-${day}`} className="rounded border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {DAY_LABELS[day]}
                  <span className="text-slate-500">({total})</span>
                </div>
                <Button
                  className="w-24"
                  type="button"
                  variant="outline"
                  onClick={() => addForDay(day)}
                >
                  + Add {DAY_LABELS[day]}
                </Button>
              </div>
            </div>
          );
        }

        const isCollapsed = !!collapsedDay[day];
        const dayOpen = !isCollapsed;
        return (
          <details
            key={`day-${day}`}
            className="rounded border bg-slate-50 dark:bg-slate-900"
            open={dayOpen}
          >
            <summary
              className="flex cursor-pointer select-none items-center justify-between gap-2 px-3 py-2"
              onClick={(e) => {
                e.preventDefault();
                setCollapsedDay((m) => ({ ...m, [day]: !m[day] }));
              }}
            >
              <div className="font-medium">
                {DAY_LABELS[day]}{" "}
                <span className="text-slate-500">({total})</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addForDay(day);
                  }}
                >
                  + Add {DAY_LABELS[day]}
                </Button>
              </div>
            </summary>

            {/* Time sub-groups */}
            <div className="space-y-2 px-3 pb-3">
              {times.map(({ startTime, rows }) => {
                const k = timeKey(day, startTime);
                const timeCollapsed = !!collapsedTime[k];
                const timeOpen = !timeCollapsed;
                return (
                  <details
                    key={k}
                    className="rounded border bg-white dark:bg-slate-950"
                    open={timeOpen}
                  >
                    <summary
                      className="flex cursor-pointer select-none items-center justify-between gap-2 px-3 py-2"
                      onClick={(e) => {
                        e.preventDefault();
                        setCollapsedTime((m) => ({ ...m, [k]: !m[k] }));
                      }}
                    >
                      <div className="text-sm font-medium">
                        {DAY_LABELS[day]} {startTime}{" "}
                        <span className="text-slate-500">({rows.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addForDayTime(day, startTime);
                          }}
                        >
                          + Add {startTime}
                        </Button>
                      </div>
                    </summary>

                    <div className="space-y-2 p-3">
                      {rows.map(({ index, fieldId }) => (
                        <OfferingRow
                          key={fieldId}
                          form={form}
                          index={index}
                          remove={() => remove(index)}
                        />
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
