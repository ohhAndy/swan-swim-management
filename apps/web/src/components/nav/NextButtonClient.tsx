"use client";

import Link from "next/link";
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
  return (
    <Button variant="outline" asChild>
      <Link href={`${baseHref}/weekday/${nextWeekday}/slot/${nextSlot}`}>
        Next →
      </Link>
    </Button>
  );
}
