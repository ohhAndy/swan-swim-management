"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSwimTeamFees,
  updateSwimTeamFees,
} from "@/lib/api/client/swim-team";

interface TierDraft {
  frequency: number;
  practiceFee: string;
  meetFee: string;
}

/** Admin editor for a season's practice and meet fees per weekly frequency */
export function SeasonFeesDialog({ termId }: { termId: string }) {
  const [open, setOpen] = useState(false);
  const [tiers, setTiers] = useState<TierDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTiers(null);
    setError(null);
    getSwimTeamFees(termId)
      .then((result) => {
        if (cancelled) return;
        setTiers(
          result.map((t) => ({
            frequency: t.frequency,
            practiceFee: t.practiceFee.toString(),
            meetFee: t.meetFee.toString(),
          })),
        );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load fees");
      });
    return () => {
      cancelled = true;
    };
  }, [open, termId]);

  const update = (
    frequency: number,
    field: "practiceFee" | "meetFee",
    value: string,
  ) =>
    setTiers(
      (prev) =>
        prev?.map((t) =>
          t.frequency === frequency ? { ...t, [field]: value } : t,
        ) ?? null,
    );

  const save = async () => {
    if (!tiers) return;
    const parsed = tiers.map((t) => ({
      frequency: t.frequency,
      practiceFee: parseFloat(t.practiceFee),
      meetFee: parseFloat(t.meetFee),
    }));
    if (
      parsed.some(
        (t) =>
          !Number.isFinite(t.practiceFee) ||
          !Number.isFinite(t.meetFee) ||
          t.practiceFee < 0 ||
          t.meetFee < 0,
      )
    ) {
      setError("Enter a fee of 0 or more for every row.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSwimTeamFees(termId, parsed);
      toast.success("Season fees updated");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save fees");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Season fees
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Season fees</DialogTitle>
          <DialogDescription>
            The practice fee is the set price for the whole season at each
            weekly frequency. The meet fee is charged once a year, only to
            swimmers who compete. Changes apply to new invoices; existing
            invoices are not altered.
          </DialogDescription>
        </DialogHeader>

        {tiers === null && !error ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading fees…
          </div>
        ) : (
          <div className="grid gap-3 py-2">
            {tiers && (
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-2 text-sm">
                <span className="text-xs font-medium text-muted-foreground">
                  Per week
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Practice fee ($ / season)
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Meet fee ($ / year)
                </span>
                {tiers.map((tier) => (
                  <div key={tier.frequency} className="contents">
                    <span className="font-medium">{tier.frequency}x</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      aria-label={`Practice fee for ${tier.frequency}x per week`}
                      value={tier.practiceFee}
                      onChange={(e) =>
                        update(tier.frequency, "practiceFee", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      aria-label={`Meet fee for ${tier.frequency}x per week`}
                      value={tier.meetFee}
                      onChange={(e) =>
                        update(tier.frequency, "meetFee", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !tiers}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save fees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
