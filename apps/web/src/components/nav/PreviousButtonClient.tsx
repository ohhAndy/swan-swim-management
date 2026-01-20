"use client";

import Link from "next/link";
import { Button } from "../ui/button";

export function PreviousButtonClient({
  baseHref,
  prevWeekday,
  prevSlot,
}: {
  baseHref: string;
  prevWeekday: number;
  prevSlot: string;
}) {
  return (
    <Button variant="outline" asChild>
      <Link href={`${baseHref}/weekday/${prevWeekday}/slot/${prevSlot}`}>
        ← Previous
      </Link>
    </Button>
  );
}
