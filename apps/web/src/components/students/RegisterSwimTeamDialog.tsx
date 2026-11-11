"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FULL_DAY_LABELS, formatTimeRange } from "@/lib/schedule/slots";
import { getTorontoDateString } from "@/lib/date";
import { calculateSwimTeamFees } from "@school/shared-types";
import {
  createSwimTeamRegistration,
  getSwimTeamSeasons,
  updateSwimTeamRegistration,
  type SwimTeamFeeSuggestion,
  type SwimTeamRegistration,
  type SwimTeamSeason,
} from "@/lib/api/client/swim-team";
import { formatSwimTeamMoney } from "@/components/swim-team/SwimTeamBadges";

const FREQUENCIES = [1, 2, 3, 4] as const;

/**
 * Registers a swimmer for a swim team season, or changes an existing
 * registration: weekly frequency, the fixed practice slots, and whether they
 * compete in meets.
 */
export function RegisterSwimTeamDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  registration,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  /** Pass the current registration to edit it instead of creating one */
  registration?: SwimTeamRegistration | null;
  onSaved: (suggestion?: SwimTeamFeeSuggestion) => void;
}) {
  const isEdit = !!registration;
  const [seasons, setSeasons] = useState<SwimTeamSeason[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seasonId, setSeasonId] = useState("");
  const [frequency, setFrequency] = useState<number>(1);
  const [competing, setCompeting] = useState(false);
  const [offeringIds, setOfferingIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load seasons and reset the form each time the dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSeasons(null);
    setLoadError(null);
    setFormError(null);
    setFrequency(registration?.frequency ?? 1);
    setCompeting(registration?.competing ?? false);
    setOfferingIds(registration?.slots.map((s) => s.offeringId) ?? []);

    getSwimTeamSeasons()
      .then((result) => {
        if (cancelled) return;
        setSeasons(result);
        const today = getTorontoDateString();
        const preferred =
          result.find((s) => s.id === registration?.termId) ??
          result.find((s) => s.endDate >= today) ??
          result[0];
        setSeasonId(preferred?.id ?? "");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load seasons",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [open, registration]);

  const season = seasons?.find((s) => s.id === seasonId) ?? null;
  const tier = season?.tiers.find((t) => t.frequency === frequency) ?? null;
  const heldOfferingIds = useMemo(
    () => new Set(registration?.slots.map((s) => s.offeringId) ?? []),
    [registration],
  );

  const fees = useMemo(() => {
    if (!season || !tier) return null;
    return calculateSwimTeamFees(
      tier,
      competing,
      season.startDate,
      season.endDate,
      registration?.startDate ?? getTorontoDateString(),
    );
  }, [season, tier, competing, registration]);

  const slotsByDay = useMemo(() => {
    const groups = new Map<number, SwimTeamSeason["slots"]>();
    for (const slot of season?.slots ?? []) {
      const day = slot.weekday ?? 0;
      groups.set(day, [...(groups.get(day) ?? []), slot]);
    }
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [season]);

  const remaining = frequency - offeringIds.length;

  const toggleSlot = (offeringId: string) => {
    setFormError(null);
    setOfferingIds((prev) => {
      if (prev.includes(offeringId)) {
        return prev.filter((id) => id !== offeringId);
      }
      if (prev.length >= frequency) return prev;
      return [...prev, offeringId];
    });
  };

  const changeFrequency = (next: number) => {
    setFormError(null);
    setFrequency(next);
    // Keep the earliest picks when stepping down a tier
    setOfferingIds((prev) => prev.slice(0, next));
  };

  const handleSubmit = async () => {
    if (!season) return;
    if (remaining !== 0) {
      setFormError(
        `Pick ${remaining} more practice slot${remaining === 1 ? "" : "s"} to match ${frequency}x per week.`,
      );
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (registration) {
        const result = await updateSwimTeamRegistration(registration.id, {
          frequency,
          competing,
          offeringIds,
        });
        toast.success("Swim team registration updated");
        onSaved(result.feeSuggestion);
      } else {
        await createSwimTeamRegistration({
          studentId,
          termId: season.id,
          frequency,
          competing,
          offeringIds,
        });
        toast.success(`${studentName} registered for ${season.name}`);
        onSaved();
      }
      onOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save registration",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Change swim team registration" : "Register for swim team"}
          </DialogTitle>
          <DialogDescription>
            {studentName} picks how many practices a week they swim and which
            fixed practice slots they attend.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </p>
        ) : seasons === null ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading seasons…
          </div>
        ) : seasons.length === 0 ? (
          <p className="rounded bg-muted p-3 text-sm text-muted-foreground">
            There is no swim team season yet. Create one from Terms, choosing
            &quot;Swim team season&quot;.
          </p>
        ) : (
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="swim-team-season">Season</Label>
              <Select
                value={seasonId}
                onValueChange={(value) => {
                  setSeasonId(value);
                  setOfferingIds([]);
                }}
                disabled={isEdit}
              >
                <SelectTrigger id="swim-team-season">
                  <SelectValue placeholder="Choose a season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Practices per week</Label>
              <div className="grid grid-cols-4 gap-2">
                {FREQUENCIES.map((f) => {
                  const t = season?.tiers.find((x) => x.frequency === f);
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={frequency === f}
                      onClick={() => changeFrequency(f)}
                      className={cn(
                        "rounded-md border p-2 text-center transition-colors",
                        frequency === f
                          ? "border-green-600 bg-green-50 text-green-900"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <div className="text-lg font-bold">{f}x</div>
                      <div className="text-xs text-muted-foreground">
                        {t ? formatSwimTeamMoney(t.practiceFee) : "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Practice slots</Label>
                <span
                  className={cn(
                    "text-xs",
                    remaining === 0
                      ? "text-green-700"
                      : "text-muted-foreground",
                  )}
                >
                  {offeringIds.length} of {frequency} picked
                </span>
              </div>
              {slotsByDay.length === 0 ? (
                <p className="rounded bg-muted p-3 text-sm text-muted-foreground">
                  This season has no practices yet. Add them from the season
                  schedule first.
                </p>
              ) : (
                <div className="grid gap-3">
                  {slotsByDay.map(([day, slots]) => (
                    <div key={day} className="grid gap-1.5">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {FULL_DAY_LABELS[day]}
                      </span>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {slots.map((slot) => {
                          const picked = offeringIds.includes(slot.offeringId);
                          const full =
                            slot.filled >= slot.capacity &&
                            !heldOfferingIds.has(slot.offeringId);
                          const disabled =
                            (!picked && offeringIds.length >= frequency) ||
                            (full && !picked);
                          return (
                            <button
                              key={slot.offeringId}
                              type="button"
                              aria-pressed={picked}
                              disabled={disabled}
                              onClick={() => toggleSlot(slot.offeringId)}
                              className={cn(
                                "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                picked
                                  ? "border-green-600 bg-green-50"
                                  : "hover:bg-muted/50",
                                disabled && "cursor-not-allowed opacity-50",
                              )}
                            >
                              <span>
                                <span className="font-medium">
                                  {slot.startTime && slot.endTime
                                    ? formatTimeRange(
                                        `${slot.startTime}-${slot.endTime}`,
                                      )
                                    : "Time TBD"}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {slot.title}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "text-xs",
                                  full
                                    ? "font-medium text-red-600"
                                    : "text-muted-foreground",
                                )}
                              >
                                {full
                                  ? "Full"
                                  : `${slot.filled}/${slot.capacity}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                checked={competing}
                onCheckedChange={(value) => setCompeting(value === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">Competes in meets</span>
                <span className="block text-xs text-muted-foreground">
                  Adds the annual meet registration fee
                  {tier ? ` (${formatSwimTeamMoney(tier.meetFee)} at ${frequency}x)` : ""}
                  . Swimmers can practise without competing.
                </span>
              </span>
            </label>

            {fees && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    Practice fee
                    {fees.monthsRemaining < fees.seasonMonths &&
                      ` (${fees.monthsRemaining} of ${fees.seasonMonths} months)`}
                  </span>
                  <span>{formatSwimTeamMoney(fees.practiceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual meet fee</span>
                  <span>{formatSwimTeamMoney(fees.meetFee)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                  <span>Suggested season total</span>
                  <span>
                    {formatSwimTeamMoney(fees.practiceFee + fees.meetFee)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isEdit
                    ? "Estimate at the new tier. After saving you will see the adjusted amount to apply to the invoice."
                    : "This is a suggestion. The amount can be edited when you create the invoice."}
                </p>
              </div>
            )}

            {formError && (
              <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
                {formError}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !season || slotsByDay.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
