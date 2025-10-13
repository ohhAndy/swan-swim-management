"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export function NextButtonClient({
  baseHref,
  nextWeekday,
  nextSlot,
}: {
  baseHref: string;
  nextWeekday: number;
  nextSlot: string;
}) {
  const router = useRouter();
  return (
    <Button
      onClick={() =>
        router.push(`${baseHref}/weekday/${nextWeekday}/slot/${nextSlot}`)
      }
      variant="outline"
    >
      Next →
    </Button>
  );
}
