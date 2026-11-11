"use client";

import { Waves } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UninvoicedSwimTeamRegistration } from "@/lib/api/client/swim-team";
import {
  CompetingBadge,
  TierBadge,
  formatPracticeSlot,
} from "@/components/swim-team/SwimTeamBadges";

export interface SwimTeamFeeAmounts {
  practice: string;
  meet: string;
}

export function defaultSwimTeamAmounts(
  registration: UninvoicedSwimTeamRegistration,
): SwimTeamFeeAmounts {
  return {
    practice: registration.suggestedPracticeFee.toString(),
    meet: registration.suggestedMeetFee.toString(),
  };
}

/** Season fee lines for the guardian's swimmers who have not been invoiced yet */
export function InvoiceSwimTeamPicker({
  registrations,
  selected,
  toggle,
  amounts,
  setAmounts,
}: {
  registrations: UninvoicedSwimTeamRegistration[];
  selected: Set<string>;
  toggle: (registrationId: string) => void;
  amounts: Record<string, SwimTeamFeeAmounts>;
  setAmounts: React.Dispatch<
    React.SetStateAction<Record<string, SwimTeamFeeAmounts>>
  >;
}) {
  if (registrations.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-green-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-green-600" aria-hidden />
          Swim Team Season Fees
        </CardTitle>
        <CardDescription>
          One invoice covers the whole season. Amounts are suggestions and can
          be edited; set up installments below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {registrations.map((r) => {
          const isSelected = selected.has(r.id);
          const current = amounts[r.id] ?? defaultSwimTeamAmounts(r);
          const prorated = r.monthsRemaining < r.seasonMonths;
          const update = (field: keyof SwimTeamFeeAmounts, value: string) =>
            setAmounts((prev) => ({
              ...prev,
              [r.id]: { ...current, [field]: value },
            }));

          return (
            <div
              key={r.id}
              className={`rounded-lg border p-3 ${isSelected ? "border-green-600 bg-green-50/50" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`swim-team-${r.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggle(r.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={`swim-team-${r.id}`}
                    className="flex flex-wrap items-center gap-2 text-base font-medium"
                  >
                    {r.studentName}
                    <TierBadge frequency={r.frequency} />
                    <CompetingBadge competing={r.competing} />
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.termName} · {r.slots.map(formatPracticeSlot).join(", ")}
                  </p>
                  {prorated && (
                    <p className="mt-1 text-xs text-amber-700">
                      Joined mid-season: practice fee prorated to{" "}
                      {r.monthsRemaining} of {r.seasonMonths} months.
                    </p>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`practice-${r.id}`} className="text-xs">
                      Practice fee ({r.frequency}x per week, season)
                    </Label>
                    <Input
                      id={`practice-${r.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={current.practice}
                      onChange={(e) => update("practice", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`meet-${r.id}`} className="text-xs">
                      Annual meet fee
                      {!r.competing && " (not competing)"}
                    </Label>
                    <Input
                      id={`meet-${r.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={current.meet}
                      onChange={(e) => update("meet", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
