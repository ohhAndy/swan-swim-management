"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import type { TrialStatus } from "@school/shared-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { updateTrialStatus } from "@/lib/api/client/trial";
import {
  CompetingBadge,
  StandingBadge,
  TierBadge,
  formatPracticeSlot,
} from "@/components/swim-team/SwimTeamBadges";
import { useOverdueCheckIn } from "@/components/swim-team/useOverdueCheckIn";
import type { RosterItem } from "./DailyClassRosterTypes";

type Mark = "present" | "absent" | "excused" | "";

const TRIAL_OPTIONS: { value: TrialStatus | ""; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "attended", label: "Attended" },
  { value: "noshow", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "Remove trial" },
];

const toMark = (status: string | null): Mark =>
  status === "present" || status === "absent" || status === "excused"
    ? status
    : "";

/**
 * Tap-to-check-in list for one swim team practice. Deliberately leaner than
 * the lesson roster: no level, ratio, report card or makeup columns.
 */
export function PracticeCheckInList({
  sessionId,
  offeringId,
  roster,
  canMark,
  onChanged,
}: {
  sessionId: string;
  offeringId: string;
  roster: RosterItem[];
  canMark: boolean;
  onChanged: () => void;
}) {
  const { markAttendance, dialog } = useOverdueCheckIn();
  const [saving, setSaving] = useState<string | null>(null);

  const swimmers = useMemo(
    () => roster.filter((r) => r.type === "student"),
    [roster],
  );
  const trials = useMemo(
    () => roster.filter((r) => r.type === "trial"),
    [roster],
  );

  const serverMarks = useMemo(
    () =>
      Object.fromEntries(swimmers.map((s) => [s.id, toMark(s.status)])) as Record<
        string,
        Mark
      >,
    [swimmers],
  );
  const [marks, setMarks] = useState(serverMarks);
  useEffect(() => setMarks(serverMarks), [serverMarks]);

  const presentCount = swimmers.filter((s) => marks[s.id] === "present").length;

  const setMark = async (swimmer: RosterItem, next: Mark) => {
    const current = marks[swimmer.id] ?? "";
    setSaving(swimmer.id);
    setMarks((prev) => ({ ...prev, [swimmer.id]: next }));
    try {
      const saved = await markAttendance(
        swimmer.id,
        sessionId,
        next,
        swimmer.name,
      );
      if (!saved) {
        setMarks((prev) => ({ ...prev, [swimmer.id]: current }));
        return;
      }
      onChanged();
    } catch (error) {
      setMarks((prev) => ({ ...prev, [swimmer.id]: current }));
      toast.error(
        error instanceof Error ? error.message : "Could not save attendance",
      );
    } finally {
      setSaving(null);
    }
  };

  const handleTrial = async (trialId: string, status: TrialStatus | "") => {
    try {
      await updateTrialStatus(trialId, status);
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the trial",
      );
    }
  };

  if (swimmers.length === 0 && trials.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        No swimmers hold this practice slot yet.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b bg-green-50/50 px-4 py-2 text-sm">
        <span className="font-medium text-green-900">
          {presentCount} of {swimmers.length} checked in
        </span>
        <span className="text-xs text-muted-foreground print:hidden">
          Tap a swimmer to check them in
        </span>
      </div>

      <ul className="divide-y">
        {swimmers.map((swimmer) => {
          const mark = marks[swimmer.id] ?? "";
          const info = swimmer.swimTeam;
          const otherSlots =
            info?.slots.filter((s) => s.offeringId !== offeringId) ?? [];
          const isSaving = saving === swimmer.id;

          return (
            <li
              key={swimmer.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                mark === "present" && "bg-green-50",
                mark === "absent" && "bg-red-50/60",
              )}
            >
              <button
                type="button"
                disabled={!canMark || isSaving}
                onClick={() =>
                  setMark(swimmer, mark === "present" ? "" : "present")
                }
                aria-pressed={mark === "present"}
                aria-label={
                  mark === "present"
                    ? `Undo check-in for ${swimmer.name}`
                    : `Check in ${swimmer.name}`
                }
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  mark === "present"
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted-foreground/30 text-transparent hover:border-green-600 hover:text-green-600",
                  !canMark && "cursor-not-allowed opacity-60",
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Check className="h-6 w-6" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {swimmer.studentId ? (
                    <Link
                      href={`/students/${swimmer.studentId}`}
                      className="truncate text-base font-semibold hover:underline"
                    >
                      {swimmer.name}
                    </Link>
                  ) : (
                    <span className="truncate text-base font-semibold">
                      {swimmer.name}
                    </span>
                  )}
                  {info && <TierBadge frequency={info.frequency} />}
                  {info && <CompetingBadge competing={info.competing} />}
                  {info && <StandingBadge standing={info.standing} />}
                </div>
                {otherSlots.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Also swims {otherSlots.map(formatPracticeSlot).join(", ")}
                  </p>
                )}
              </div>

              {canMark && (
                <Button
                  variant={mark === "absent" ? "destructive" : "ghost"}
                  size="sm"
                  disabled={isSaving}
                  onClick={() =>
                    setMark(swimmer, mark === "absent" ? "" : "absent")
                  }
                  className="shrink-0 text-xs print:hidden"
                >
                  Absent
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {trials.length > 0 && (
        <div className="border-t bg-purple-50/60 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase text-purple-800">
            Trials
          </p>
          <ul className="flex flex-wrap gap-2">
            {trials.map((trial) => (
              <li key={trial.id}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!canMark}>
                    <button
                      type="button"
                      className={cn(
                        "rounded-md bg-purple-100 px-2 py-1 text-sm text-purple-900",
                        trial.status === "attended" &&
                          "bg-green-100 text-green-900",
                        (trial.status === "noshow" ||
                          trial.status === "cancelled") &&
                          "line-through opacity-70",
                      )}
                    >
                      {trial.name}
                      {trial.age !== null ? `, ${trial.age}` : ""}
                      <span className="ml-2 text-xs opacity-70">
                        {trial.status}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {TRIAL_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.label}
                        onClick={() => handleTrial(trial.id, option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialog}
    </div>
  );
}
