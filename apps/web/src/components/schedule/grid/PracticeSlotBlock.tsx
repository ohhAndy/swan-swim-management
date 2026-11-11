"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, Users, Waves, X } from "lucide-react";
import type { RosterResponse, RosterRow, TrialLite } from "@school/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth/user";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { updateTrialStatus } from "@/lib/api/client/trial";
import { AssignInstructorDialog, ScheduleTrialDialog } from "../dialogs";
import {
  CompetingBadge,
  StandingBadge,
  TierBadge,
  formatCalendarDay,
  formatPracticeSlot,
} from "@/components/swim-team/SwimTeamBadges";
import { useOverdueCheckIn } from "@/components/swim-team/useOverdueCheckIn";

type Mark = "present" | "absent" | "excused" | "";

const TRIAL_OPTIONS: { value: TrialLite["status"] | ""; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "attended", label: "Attended" },
  { value: "noshow", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "Remove trial" },
];

/** Tap order for a check-in cell */
const NEXT_MARK: Record<Mark, Mark> = {
  "": "present",
  present: "absent",
  absent: "",
  excused: "",
};

const markKey = (enrollmentId: string, sessionId: string) =>
  `${enrollmentId}:${sessionId}`;

interface Practice {
  ymd: string;
  sessionId: string;
  status: RosterResponse["status"];
  /** Enrollments listed on this practice */
  enrollmentIds: Set<string>;
  trials: TrialLite[];
}

/**
 * One swim team practice group for one month: who is in it, how often they
 * swim, whether they compete, where they stand on payments, and a tap-to-
 * check-in cell per practice.
 */
export function PracticeSlotBlock({
  title,
  rosters,
  user,
  today,
}: {
  title: string;
  rosters: RosterResponse[];
  user: CurrentUser;
  /** Business "today" as YYYY-MM-DD, used to highlight the current practice */
  today: string;
}) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const { markAttendance, dialog: overdueDialog } = useOverdueCheckIn();
  const [saving, setSaving] = useState<string | null>(null);
  const [instructorOpen, setInstructorOpen] = useState(false);
  const [trialTarget, setTrialTarget] = useState<Practice | null>(null);

  const offeringId = rosters[0]?.session.offeringId ?? "";
  const instructors = rosters[0]?.session.instructors ?? [];
  const instructorNames = instructors.map((i) => i.staffName).join(", ");
  const capacity = rosters[0]?.capacity ?? 0;

  const practices: Practice[] = useMemo(
    () =>
      [...rosters]
        .sort((a, b) => a.session.date.localeCompare(b.session.date))
        .map((r) => ({
          ymd: r.session.date.slice(0, 10),
          sessionId: r.session.id,
          status: r.status,
          enrollmentIds: new Set(r.roster.map((row) => row.enrollmentId)),
          trials: r.trials,
        })),
    [rosters],
  );

  // One row per swimmer; the latest roster a swimmer appears on wins so
  // badges reflect their current tier.
  const swimmers: RosterRow[] = useMemo(() => {
    const byEnrollment = new Map<string, RosterRow>();
    for (const r of rosters) {
      for (const row of r.roster) byEnrollment.set(row.enrollmentId, row);
    }
    return [...byEnrollment.values()].sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );
  }, [rosters]);

  const serverMarks = useMemo(() => {
    const marks: Record<string, Mark> = {};
    for (const r of rosters) {
      for (const row of r.roster) {
        if (row.attendance) {
          marks[markKey(row.enrollmentId, r.session.id)] =
            row.attendance.status;
        }
      }
    }
    return marks;
  }, [rosters]);

  const [marks, setMarks] = useState(serverMarks);
  useEffect(() => setMarks(serverMarks), [serverMarks]);

  const activeCount = swimmers.filter(
    (s) => s.enrollmentStatus !== "inactive",
  ).length;
  const behindCount = swimmers.filter(
    (s) =>
      s.enrollmentStatus !== "inactive" &&
      s.swimTeam?.standing.state === "behind",
  ).length;

  const refresh = () => startTransition(() => router.refresh());

  const handleMark = async (swimmer: RosterRow, practice: Practice) => {
    const key = markKey(swimmer.enrollmentId, practice.sessionId);
    const current = marks[key] ?? "";
    const next = NEXT_MARK[current];
    setSaving(key);
    setMarks((prev) => ({ ...prev, [key]: next }));
    try {
      const saved = await markAttendance(
        swimmer.enrollmentId,
        practice.sessionId,
        next,
        swimmer.studentName,
      );
      if (!saved) {
        setMarks((prev) => ({ ...prev, [key]: current }));
        return;
      }
      refresh();
    } catch (error) {
      setMarks((prev) => ({ ...prev, [key]: current }));
      toast.error(
        error instanceof Error ? error.message : "Could not save attendance",
      );
    } finally {
      setSaving(null);
    }
  };

  const handleTrialStatus = async (trialId: string, status: string) => {
    try {
      await updateTrialStatus(
        trialId,
        status as TrialLite["status"] | "",
      );
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the trial",
      );
    }
  };

  const hasTrials = practices.some((p) => p.trials.length > 0);

  return (
    <div
      className="relative break-inside-avoid print:mb-5"
      id={offeringId ? `offering-${offeringId}` : undefined}
    >
      <Card className="overflow-hidden border-l-4 border-l-green-600 bg-white shadow-sm">
        <CardHeader className="gap-2 border-b bg-green-50/60 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
                <Waves className="h-3 w-3" aria-hidden />
                Swim Team
              </Badge>
              <CardTitle className="text-base">{title}</CardTitle>
              <PermissionGate
                allowedRoles={["super_admin", "admin", "manager", "supervisor"]}
                currentRole={user.role}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInstructorOpen(true)}
                  disabled={!offeringId}
                  className="h-7 bg-white text-xs print:hidden"
                >
                  <Users className="mr-1 h-3 w-3" />
                  {instructorNames || "No coach assigned"}
                </Button>
              </PermissionGate>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {behindCount > 0 && (
                <span className="font-medium text-red-600">
                  {behindCount} behind on payments
                </span>
              )}
              <span className="font-semibold text-green-800">
                {activeCount}
                {capacity ? ` / ${capacity}` : ""} swimmers
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "overflow-x-auto p-0",
            isRefreshing && "pointer-events-none opacity-60",
          )}
        >
          {swimmers.length === 0 && !hasTrials ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No swimmers hold this practice slot yet. Register a swimmer from
              their student page.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 font-medium">
                    Swimmer
                  </th>
                  <th className="px-2 py-2 font-medium">Per week</th>
                  <th className="px-2 py-2 font-medium">Meets</th>
                  <th className="px-2 py-2 font-medium">Payment</th>
                  <th className="px-2 py-2 font-medium print:hidden">
                    Other practices
                  </th>
                  {practices.map((p) => (
                    <th
                      key={p.sessionId}
                      className={cn(
                        "min-w-14 px-1 py-2 text-center font-medium",
                        p.ymd === today && "bg-green-100 text-green-900",
                        p.status === "canceled" && "line-through",
                      )}
                    >
                      {formatCalendarDay(p.ymd)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swimmers.map((swimmer) => {
                  const info = swimmer.swimTeam;
                  const inactive = swimmer.enrollmentStatus === "inactive";
                  const otherSlots =
                    info?.slots.filter((s) => s.offeringId !== offeringId) ??
                    [];
                  return (
                    <tr
                      key={swimmer.enrollmentId}
                      className={cn(
                        "border-b last:border-b-0",
                        inactive && "text-muted-foreground",
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-2">
                        <Link
                          href={`/students/${swimmer.studentId}`}
                          className="font-medium hover:underline"
                        >
                          {swimmer.studentName}
                        </Link>
                        {inactive && (
                          <span className="ml-2 text-xs">(left this slot)</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {info && <TierBadge frequency={info.frequency} />}
                      </td>
                      <td className="px-2 py-2">
                        {info && <CompetingBadge competing={info.competing} />}
                      </td>
                      <td className="px-2 py-2">
                        {info && <StandingBadge standing={info.standing} />}
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground print:hidden">
                        {otherSlots.length > 0
                          ? otherSlots.map(formatPracticeSlot).join(", ")
                          : "None"}
                      </td>
                      {practices.map((p) => {
                        const key = markKey(swimmer.enrollmentId, p.sessionId);
                        const mark = marks[key] ?? "";
                        const listed = p.enrollmentIds.has(
                          swimmer.enrollmentId,
                        );
                        return (
                          <td
                            key={p.sessionId}
                            className={cn(
                              "px-1 py-1 text-center",
                              p.ymd === today && "bg-green-50",
                            )}
                          >
                            {listed && p.status !== "canceled" ? (
                              <button
                                type="button"
                                onClick={() => handleMark(swimmer, p)}
                                disabled={saving === key}
                                aria-label={`${swimmer.studentName}, ${formatCalendarDay(p.ymd)}: ${mark || "not marked"}`}
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors print:h-6 print:w-6",
                                  mark === "present" &&
                                    "border-green-600 bg-green-600 text-white",
                                  mark === "absent" &&
                                    "border-red-500 bg-red-50 text-red-600",
                                  mark === "excused" &&
                                    "border-amber-500 bg-amber-50 text-amber-700",
                                  mark === "" &&
                                    "border-dashed text-transparent hover:border-green-600 hover:text-green-600",
                                )}
                              >
                                {saving === key ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : mark === "absent" ? (
                                  <X className="h-4 w-4" />
                                ) : mark === "excused" ? (
                                  <span className="text-xs font-semibold">E</span>
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                <tr className="border-t bg-purple-50/60 print:hidden">
                  <td
                    colSpan={5}
                    className="sticky left-0 z-10 bg-purple-50 px-3 py-2 text-xs font-semibold uppercase text-purple-800"
                  >
                    Trials
                  </td>
                  {practices.map((p) => (
                    <td key={p.sessionId} className="px-1 py-1 align-top">
                      <div className="flex flex-col items-center gap-1">
                        {p.trials.map((trial) => (
                          <DropdownMenu key={trial.id}>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                title={`${trial.childName} (${trial.status})`}
                                className={cn(
                                  "max-w-20 truncate rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-900",
                                  trial.status === "attended" &&
                                    "bg-green-100 text-green-900",
                                  (trial.status === "noshow" ||
                                    trial.status === "cancelled") &&
                                    "line-through opacity-70",
                                )}
                              >
                                {trial.childName}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {TRIAL_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                  key={option.label}
                                  onClick={() =>
                                    handleTrialStatus(trial.id, option.value)
                                  }
                                >
                                  {option.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ))}
                        <PermissionGate
                          allowedRoles={["super_admin", "admin", "manager"]}
                          currentRole={user.role}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-purple-700"
                            aria-label={`Add a trial on ${formatCalendarDay(p.ymd)}`}
                            onClick={() => setTrialTarget(p)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ScheduleTrialDialog
        open={trialTarget !== null}
        onOpenChange={(open) => !open && setTrialTarget(null)}
        selectedDate={trialTarget ? `${trialTarget.ymd}T04:00:00.000Z` : null}
        sessionId={trialTarget?.sessionId ?? null}
        offeringTitle={title}
        onSuccess={refresh}
      />

      <AssignInstructorDialog
        open={instructorOpen}
        onOpenChange={setInstructorOpen}
        classOfferingId={offeringId}
        currentInstructors={instructors}
        onSuccess={refresh}
        levelName={title}
      />

      {overdueDialog}
    </div>
  );
}
