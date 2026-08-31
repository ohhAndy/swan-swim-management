"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Term } from "@school/shared-types";
import Link from "next/link";

export default function TermSlot({
  termOptions,
  year,
}: {
  termOptions: Term[];
  year: string;
}) {
  const now = new Date();

  const isCurrent = (t: Term) => {
    if (!t.startDate || !t.endDate) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const getDisplayName = (name: string) => {
    if (!year || year === "Other") return name;
    const cleaned = name
      .replace(new RegExp(`^${year}\\s*[-–—:]?\\s*`, "i"), "")
      .replace(new RegExp(`\\s*[-–—:]?\\s*${year}$`, "i"), "")
      .trim();
    return cleaned || name;
  };

  return (
    <Card className="w-full rounded-sm">
      <CardHeader className="text-lg font-semibold text-center font-fredoka">
        <CardTitle>{year}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 items-center">
          {termOptions.map((t) => {
            const current = isCurrent(t);
            const displayName = getDisplayName(t.name);
            return (
              <Button
                key={t.id}
                asChild
                variant="ghost"
                className={`w-full flex rounded-md transition cursor-pointer px-2 py-2 h-auto justify-center ${
                  current
                    ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-400 hover:bg-emerald-100 font-semibold"
                    : "hover:bg-muted text-[#1c82c5]"
                }`}
              >
                <Link href={`/term/${t.id}/schedule/`}>
                  <span className="text-center align-middle text-sm break-words whitespace-normal leading-tight">
                    {displayName}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
