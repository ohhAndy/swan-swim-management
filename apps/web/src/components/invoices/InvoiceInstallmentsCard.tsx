"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlannedInstallment } from "@school/shared-types";
import type { Invoice } from "@/lib/types/models";
import { updateInvoiceInstallments } from "@/lib/api/client/invoice";
import { getTorontoDateString } from "@/lib/date";
import {
  formatCalendarDay,
  formatSwimTeamMoney,
} from "@/components/swim-team/SwimTeamBadges";
import {
  InvoiceInstallmentPlan,
  installmentsMatchTotal,
} from "./InvoiceInstallmentPlan";

type RowState = "paid" | "partial" | "past_due" | "upcoming";

const ROW_LABEL: Record<RowState, string> = {
  paid: "Paid",
  partial: "Partly paid",
  past_due: "Past due",
  upcoming: "Upcoming",
};

/** Payments are applied to installments in due-date order */
function describePlan(
  installments: PlannedInstallment[],
  amountPaid: number,
  today: string,
) {
  let remainingCents = Math.round(amountPaid * 100);
  return installments.map((row) => {
    const cents = Math.round(row.amount * 100);
    const applied = Math.min(cents, Math.max(0, remainingCents));
    remainingCents -= applied;
    const isDue = row.dueDate <= today;
    const state: RowState =
      applied >= cents
        ? "paid"
        : isDue
          ? "past_due"
          : applied > 0
            ? "partial"
            : "upcoming";
    return { ...row, state, outstanding: (cents - applied) / 100 };
  });
}

/**
 * Shows an invoice's installment plan and where the family stands on it, and
 * lets managers set up or change the plan.
 */
export function InvoiceInstallmentsCard({
  invoice,
  canEdit,
  onSaved,
}: {
  invoice: Invoice;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlannedInstallment[]>([]);
  const [saving, setSaving] = useState(false);

  const today = getTorontoDateString();
  const total = Number(invoice.totalAmount);
  const current: PlannedInstallment[] = (invoice.installments ?? []).map(
    (i) => ({ dueDate: i.dueDate.slice(0, 10), amount: Number(i.amount) }),
  );
  const hasSwimTeamLines = invoice.lineItems.some(
    (item) => item.swimTeamRegistrationId,
  );

  // Only invoices with a plan, or swim team invoices that could use one
  if (current.length === 0 && !hasSwimTeamLines) return null;

  const rows = describePlan(current, invoice.amountPaid, today);
  const behind = invoice.standing?.behindAmount ?? 0;

  const startEditing = () => {
    setDraft(current);
    setEditing(true);
  };

  const save = async () => {
    if (!installmentsMatchTotal(draft, total)) {
      toast.error("Installments must add up to the invoice total");
      return;
    }
    setSaving(true);
    try {
      await updateInvoiceInstallments(invoice.id, draft);
      toast.success(
        draft.length > 0 ? "Payment plan saved" : "Payment plan removed",
      );
      setEditing(false);
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the plan",
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <InvoiceInstallmentPlan
          total={total}
          defaultFirstDueDate={today}
          installments={draft}
          onChange={setDraft}
          title="Edit Payment Plan"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex flex-wrap items-center gap-2">
          Payment Plan
          {current.length > 0 &&
            (behind > 0 ? (
              <Badge variant="destructive">
                Behind {formatSwimTeamMoney(behind)}
              </Badge>
            ) : invoice.balance <= 0 ? (
              <Badge
                variant="outline"
                className="border-green-600 text-green-700"
              >
                Paid in full
              </Badge>
            ) : (
              <Badge variant="outline" className="border-sky-600 text-sky-700">
                On plan
              </Badge>
            ))}
        </CardTitle>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            {current.length > 0 ? "Edit plan" : "Set up installments"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {invoice.installmentsOutOfSync && (
          <p
            role="alert"
            className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900"
          >
            The line items changed after this plan was set up, so the
            installments no longer add up to the invoice total. Edit the plan
            to bring it back in line.
          </p>
        )}

        {current.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No installment plan: the full amount is due now
            {invoice.balance > 0
              ? ` (${formatSwimTeamMoney(invoice.balance)} outstanding).`
              : "."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.dueDate}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {formatCalendarDay(row.dueDate, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatSwimTeamMoney(row.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.outstanding > 0
                      ? formatSwimTeamMoney(row.outstanding)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.state === "past_due"
                          ? "font-medium text-red-600"
                          : row.state === "paid"
                            ? "text-green-700"
                            : "text-muted-foreground"
                      }
                    >
                      {ROW_LABEL[row.state]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
