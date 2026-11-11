"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildInstallmentPlan,
  type PlannedInstallment,
} from "@school/shared-types";

const toCents = (amount: number) => Math.round(amount * 100);

/** Plans are pay in full or exactly this many monthly installments */
export const INSTALLMENT_COUNT = 4;

export function installmentsMatchTotal(
  installments: PlannedInstallment[],
  total: number,
): boolean {
  if (installments.length === 0) return true;
  return (
    installments.reduce((sum, i) => sum + toCents(i.amount), 0) ===
    toCents(total)
  );
}

/**
 * Chooses how an invoice is paid: in full, or in four installments. Picking
 * installments generates four equal monthly payments, whose dates and amounts
 * can then be adjusted by hand as long as they still add up to the total.
 */
export function InvoiceInstallmentPlan({
  total,
  defaultFirstDueDate,
  installments,
  onChange,
  title = "Payment Plan",
}: {
  total: number;
  defaultFirstDueDate: string;
  installments: PlannedInstallment[];
  onChange: (installments: PlannedInstallment[]) => void;
  title?: string;
}) {
  const [count, setCount] = useState(
    installments.length > 0 ? INSTALLMENT_COUNT : 1,
  );
  const [firstDueDate, setFirstDueDate] = useState(
    installments[0]?.dueDate ?? defaultFirstDueDate,
  );

  // Regenerate whenever the plan inputs or the invoice total change. When
  // editing an existing plan, keep its hand-adjusted rows on first render.
  const [touched, setTouched] = useState(installments.length === 0);
  useEffect(() => {
    if (!touched) return;
    if (count <= 1 || total <= 0 || !firstDueDate) {
      onChange([]);
      return;
    }
    onChange(buildInstallmentPlan(total, count, firstDueDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, firstDueDate, total, touched]);

  const planTotal = installments.reduce((sum, i) => sum + i.amount, 0);
  const matches = installmentsMatchTotal(installments, total);

  const updateRow = (index: number, patch: Partial<PlannedInstallment>) => {
    onChange(
      installments.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Pay in full or split the total into installments. Swim team check-in
          warns staff when an installment is past due.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="installment-count">Plan</Label>
            <Select
              value={count.toString()}
              onValueChange={(value) => {
                setTouched(true);
                setCount(Number(value));
              }}
            >
              <SelectTrigger id="installment-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Pay in full</SelectItem>
                <SelectItem value={INSTALLMENT_COUNT.toString()}>
                  {INSTALLMENT_COUNT} monthly installments
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {count > 1 && (
            <div>
              <Label htmlFor="installment-first-due">First installment due</Label>
              <Input
                id="installment-first-due"
                type="date"
                value={firstDueDate}
                onChange={(e) => {
                  setTouched(true);
                  setFirstDueDate(e.target.value);
                }}
              />
            </div>
          )}
        </div>

        {count <= 1 ? (
          <p className="text-sm text-muted-foreground">
            The full amount is due when the invoice is created.
          </p>
        ) : total <= 0 ? (
          <p className="text-sm text-muted-foreground">
            Add line items to generate the installments.
          </p>
        ) : (
          <div className="space-y-2">
            {installments.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr_1fr] items-center gap-3"
              >
                <span className="w-6 text-sm text-muted-foreground">
                  {index + 1}.
                </span>
                <Input
                  type="date"
                  aria-label={`Installment ${index + 1} due date`}
                  value={row.dueDate}
                  onChange={(e) => updateRow(index, { dueDate: e.target.value })}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label={`Installment ${index + 1} amount`}
                  value={row.amount}
                  onChange={(e) =>
                    updateRow(index, {
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            ))}
            {!matches && (
              <p role="alert" className="text-sm text-red-600">
                Installments add up to ${planTotal.toFixed(2)} but the invoice
                total is ${total.toFixed(2)}. Adjust the amounts so they match.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
