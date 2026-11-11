import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DAY_LABELS, formatTime } from "@/lib/schedule/slots";
import { Trophy } from "lucide-react";
import type { SwimTeamStanding } from "@school/shared-types";

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

export function formatSwimTeamMoney(amount: number): string {
  return currency.format(amount);
}

/** "Mon 5:00 PM" */
export function formatPracticeSlot(slot: {
  weekday: number | null;
  startTime: string | null;
}): string {
  const day = slot.weekday !== null ? (DAY_LABELS[slot.weekday] ?? "") : "";
  const time = slot.startTime ? formatTime(slot.startTime) : "";
  return `${day} ${time}`.trim();
}

/** "Nov 3" from a YYYY-MM-DD calendar date, never shifted by the browser timezone */
export function formatCalendarDay(
  ymd: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  return new Date(`${ymd.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString(
    "en-CA",
    { ...options, timeZone: "UTC" },
  );
}

export function TierBadge({
  frequency,
  className,
}: {
  frequency: number;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      title={`${frequency} practice${frequency === 1 ? "" : "s"} per week`}
      className={cn(
        "whitespace-nowrap border-green-600 bg-green-50 text-green-800",
        className,
      )}
    >
      {frequency}x / wk
    </Badge>
  );
}

export function CompetingBadge({
  competing,
  className,
}: {
  competing: boolean;
  className?: string;
}) {
  if (!competing) {
    return (
      <span
        className={cn(
          "whitespace-nowrap text-xs text-muted-foreground",
          className,
        )}
      >
        Practice only
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      title="Registered to compete in meets"
      className={cn(
        "gap-1 whitespace-nowrap border-amber-500 bg-amber-50 text-amber-800",
        className,
      )}
    >
      <Trophy className="h-3 w-3" aria-hidden />
      Meets
    </Badge>
  );
}

export function StandingBadge({
  standing,
  className,
}: {
  standing: SwimTeamStanding;
  className?: string;
}) {
  const nextDue = standing.nextDueDate
    ? `Next installment due ${formatCalendarDay(standing.nextDueDate)}`
    : undefined;

  switch (standing.state) {
    case "behind":
      return (
        <Badge
          variant="destructive"
          className={cn("whitespace-nowrap", className)}
          title="Behind on the payment plan"
        >
          {standing.behindAmount !== null
            ? `Behind ${formatSwimTeamMoney(standing.behindAmount)}`
            : "Behind"}
        </Badge>
      );
    case "not_invoiced":
      return (
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap border-dashed text-muted-foreground",
            className,
          )}
          title="No season invoice yet"
        >
          Not invoiced
        </Badge>
      );
    case "paid":
      return (
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap border-green-600 text-green-700",
            className,
          )}
          title="Season paid in full"
        >
          Paid
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap border-sky-600 text-sky-700",
            className,
          )}
          title={nextDue ?? "Up to date on the payment plan"}
        >
          On plan
        </Badge>
      );
  }
}
