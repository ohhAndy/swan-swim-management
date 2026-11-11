"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FULL_DAY_LABELS, formatTimeRange } from "@/lib/schedule/slots";
import { hasMinRole, type StaffRole } from "@/lib/auth/permissions";
import {
  getStudentSwimTeamRegistrations,
  withdrawSwimTeamRegistration,
  type SwimTeamFeeSuggestion,
  type SwimTeamRegistration,
} from "@/lib/api/client/swim-team";
import {
  CompetingBadge,
  StandingBadge,
  TierBadge,
  formatCalendarDay,
  formatSwimTeamMoney,
} from "@/components/swim-team/SwimTeamBadges";
import { RegisterSwimTeamDialog } from "./RegisterSwimTeamDialog";

export function SwimTeamCard({
  studentId,
  studentName,
  userRole,
  onChanged,
}: {
  studentId: string;
  studentName: string;
  userRole: StaffRole;
  onChanged?: () => void;
}) {
  const canManage = hasMinRole(userRole, "manager");
  const [registrations, setRegistrations] = useState<
    SwimTeamRegistration[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SwimTeamRegistration | null>(null);
  const [withdrawing, setWithdrawing] = useState<SwimTeamRegistration | null>(
    null,
  );
  const [suggestion, setSuggestion] = useState<SwimTeamFeeSuggestion | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      setRegistrations(await getStudentSwimTeamRegistrations(studentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load swim team");
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaved = (next?: SwimTeamFeeSuggestion) => {
    // Only surface the adjustment when there is an invoice to adjust
    setSuggestion(next && next.invoiceIds.length > 0 ? next : null);
    void load();
    onChanged?.();
  };

  const handleWithdraw = async () => {
    if (!withdrawing) return;
    try {
      await withdrawSwimTeamRegistration(withdrawing.id);
      toast.success("Swimmer withdrawn from the swim team");
      setSuggestion(null);
      void load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not withdraw");
    } finally {
      setWithdrawing(null);
    }
  };

  const active = registrations?.filter((r) => r.status === "active") ?? [];
  const past = registrations?.filter((r) => r.status !== "active") ?? [];

  return (
    <Card className="mt-6 border-l-4 border-l-green-600">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Waves className="h-5 w-5 text-green-600" aria-hidden />
          Swim Team
        </CardTitle>
        {canManage && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Register for a season
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center justify-between rounded bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : registrations === null ? (
          <Skeleton className="h-20 w-full" />
        ) : active.length === 0 && past.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not on the swim team.
          </p>
        ) : (
          <>
            {active.map((r) => (
              <div key={r.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.termName}</span>
                    <TierBadge frequency={r.frequency} />
                    <CompetingBadge competing={r.competing} />
                    <StandingBadge standing={r.standing} />
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(r);
                          setDialogOpen(true);
                        }}
                      >
                        Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setWithdrawing(r)}
                      >
                        Withdraw
                      </Button>
                    </div>
                  )}
                </div>

                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {r.slots.map((slot) => (
                    <li key={slot.enrollmentId}>
                      <Link
                        href={`/term/${r.termId}/schedule/weekday/${slot.weekday}/slot/${slot.startTime}-${slot.endTime}?highlight=${slot.offeringId}`}
                        className="hover:underline"
                      >
                        <span className="font-medium">
                          {slot.weekday !== null
                            ? FULL_DAY_LABELS[slot.weekday]
                            : ""}
                        </span>{" "}
                        {slot.startTime && slot.endTime
                          ? formatTimeRange(`${slot.startTime}-${slot.endTime}`)
                          : ""}
                        <span className="text-muted-foreground">
                          {" "}
                          · {slot.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mt-2 text-xs text-muted-foreground">
                  {r.standing.state === "not_invoiced" ? (
                    canManage ? (
                      <Link
                        href="/admin/invoices/new"
                        className="text-green-700 underline"
                      >
                        Create the season invoice
                      </Link>
                    ) : (
                      "No season invoice yet."
                    )
                  ) : (
                    <>
                      {r.standing.state === "behind" &&
                        `${formatSwimTeamMoney(r.standing.behindAmount)} past due. `}
                      {r.standing.nextDueDate &&
                        `Next installment due ${formatCalendarDay(r.standing.nextDueDate, { month: "long", day: "numeric" })}. `}
                      {canManage &&
                        r.standing.invoiceIds.map((id, i) => (
                          <Link
                            key={id}
                            href={`/invoices/${id}`}
                            className="mr-2 text-green-700 underline"
                          >
                            View invoice
                            {r.standing.invoiceIds.length > 1 ? ` ${i + 1}` : ""}
                          </Link>
                        ))}
                    </>
                  )}
                </p>
              </div>
            ))}

            {suggestion && (
              <div
                role="status"
                className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
              >
                <p className="font-medium">
                  The season invoice may need adjusting
                </p>
                <p className="mt-1 text-muted-foreground">
                  Suggested practice fee{" "}
                  <strong>{formatSwimTeamMoney(suggestion.practiceFee)}</strong>{" "}
                  (invoiced {formatSwimTeamMoney(suggestion.invoicedPracticeFee)}
                  ), meet fee{" "}
                  <strong>{formatSwimTeamMoney(suggestion.meetFee)}</strong>{" "}
                  (invoiced {formatSwimTeamMoney(suggestion.invoicedMeetFee)}).
                  Months already swum stay at the old tier.
                </p>
                <div className="mt-2 flex gap-3">
                  {suggestion.invoiceIds.map((id) => (
                    <Link
                      key={id}
                      href={`/invoices/${id}`}
                      className="text-green-700 underline"
                    >
                      Open invoice to edit
                    </Link>
                  ))}
                  <button
                    type="button"
                    className="text-muted-foreground underline"
                    onClick={() => setSuggestion(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {past.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Previously:{" "}
                {past
                  .map(
                    (r) =>
                      `${r.termName} (${r.frequency}x${r.endDate ? `, left ${formatCalendarDay(r.endDate, { month: "short", day: "numeric", year: "numeric" })}` : ""})`,
                  )
                  .join("; ")}
              </p>
            )}
          </>
        )}
      </CardContent>

      <RegisterSwimTeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={studentId}
        studentName={studentName}
        registration={editing}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={withdrawing !== null}
        onOpenChange={(open) => !open && setWithdrawing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Withdraw {studentName} from {withdrawing?.termName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from all of their practice slots from today.
              Past attendance and the season invoice are kept; adjust the
              invoice separately if a refund or credit is due.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              className="bg-red-600 hover:bg-red-700"
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
