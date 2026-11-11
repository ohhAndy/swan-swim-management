import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Steps a swim team season view one month at a time via `?month=YYYY-MM` */
export function MonthPager({
  basePath,
  month,
  months,
}: {
  basePath: string;
  month: string;
  months: string[];
}) {
  const index = months.indexOf(month);
  const prev = index > 0 ? months[index - 1] : null;
  const next = index >= 0 && index < months.length - 1 ? months[index + 1] : null;

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        asChild={!!prev}
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={!prev}
        aria-label="Previous month"
      >
        {prev ? (
          <Link href={`${basePath}?month=${prev}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      <span className="min-w-36 text-center text-sm font-semibold">
        {monthLabel(month)}
      </span>
      <Button
        asChild={!!next}
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={!next}
        aria-label="Next month"
      >
        {next ? (
          <Link href={`${basePath}?month=${next}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
