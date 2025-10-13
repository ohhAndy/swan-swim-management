"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";

import { useRouter } from "next/navigation";

export default function TimeSlots({
  timeSlots,
  weekday,
  termId,
}: {
  timeSlots: string[];
  weekday: number;
  termId: string;
}) {
  const router = useRouter();
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
              type="button"
              variant="ghost"
              className="w-full flex rounded-md hover:bg-muted transition cursor-pointer"
              onClick={() =>
                router.push(
                  `/term/${termId}/schedule/weekday/${weekday}/slot/${timeSlots[i]}`
                )
              }
            >
              <span className="text-center align-middle text-sm text-[#1c82c5]">{t}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
