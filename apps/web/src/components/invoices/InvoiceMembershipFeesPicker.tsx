"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, CheckCheck, Layers } from "lucide-react";
import type { UninvoicedMembershipItem } from "@/lib/api/client/memberships";

export interface InvoiceMembershipFeesPickerProps {
  membershipFees: UninvoicedMembershipItem[];
  selectedFeeKeys: Set<string>;
  toggleFee: (key: string) => void;
  feeAmounts: Record<string, string>;
  setFeeAmounts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  hasActiveMemberships: boolean;
  isLoading?: boolean;
}

export function getFeeItemKey(fee: UninvoicedMembershipItem): string {
  return `${fee.membershipId}:${fee.feeType}:${fee.billingPeriod}`;
}

export function InvoiceMembershipFeesPicker({
  membershipFees,
  selectedFeeKeys,
  toggleFee,
  feeAmounts,
  setFeeAmounts,
  hasActiveMemberships,
  isLoading,
}: InvoiceMembershipFeesPickerProps) {
  // If the guardian doesn't have any active memberships and there are no fees, don't display
  if (!hasActiveMemberships && membershipFees.length === 0) {
    return null;
  }

  const allSelected =
    membershipFees.length > 0 &&
    membershipFees.every((fee) => selectedFeeKeys.has(getFeeItemKey(fee)));

  function toggleAll() {
    if (allSelected) {
      membershipFees.forEach((fee) => {
        if (selectedFeeKeys.has(getFeeItemKey(fee))) {
          toggleFee(getFeeItemKey(fee));
        }
      });
    } else {
      membershipFees.forEach((fee) => {
        if (!selectedFeeKeys.has(getFeeItemKey(fee))) {
          toggleFee(getFeeItemKey(fee));
        }
      });
    }
  }

  // Convenience helper: select the next N monthly practice fees
  function selectNextMonths(count: number) {
    const monthlyFees = membershipFees.filter(
      (f) => f.feeType === "MONTHLY_PRACTICE",
    );
    const targetKeys = new Set(
      monthlyFees.slice(0, count).map((f) => getFeeItemKey(f)),
    );

    monthlyFees.forEach((fee) => {
      const key = getFeeItemKey(fee);
      const isSelected = selectedFeeKeys.has(key);
      const shouldBeSelected = targetKeys.has(key);

      if (shouldBeSelected && !isSelected) {
        toggleFee(key);
      } else if (!shouldBeSelected && isSelected) {
        toggleFee(key);
      }
    });
  }

  // Selected counts & subtotal
  const selectedItems = membershipFees.filter((f) =>
    selectedFeeKeys.has(getFeeItemKey(f)),
  );
  const selectedMonthlyCount = selectedItems.filter(
    (f) => f.feeType === "MONTHLY_PRACTICE",
  ).length;
  const selectedAnnualCount = selectedItems.filter(
    (f) => f.feeType === "ANNUAL_REGISTRATION",
  ).length;

  const subtotal = selectedItems.reduce((sum, fee) => {
    const key = getFeeItemKey(fee);
    const val = parseFloat(feeAmounts[key] ?? fee.suggestedAmount.toString());
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <Card className="border-sky-200 dark:border-sky-900 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <CardTitle>Competitive Team Fees</CardTitle>
            </div>
            <CardDescription>
              Annual registration &amp; monthly practice fees. Select one or multiple months to bill together on this invoice.
            </CardDescription>
          </div>

          {membershipFees.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={toggleAll}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
              {membershipFees.filter((f) => f.feeType === "MONTHLY_PRACTICE").length >= 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => selectNextMonths(3)}
                  title="Select the next 3 months of practice fees"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Next 3 Months
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading team membership fees...
          </div>
        ) : membershipFees.length === 0 ? (
          <div className="py-5 px-4 text-center rounded-md border border-dashed bg-muted/20">
            <p className="text-sm font-medium text-muted-foreground">
              No pending membership fees found.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              All registration and practice fees for this season have already been invoiced or paid.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {membershipFees.map((fee) => {
              const key = getFeeItemKey(fee);
              const isSelected = selectedFeeKeys.has(key);
              const currentAmount =
                feeAmounts[key] ?? fee.suggestedAmount.toString();
              const isAnnual = fee.feeType === "ANNUAL_REGISTRATION";

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 border rounded-md transition-colors ${
                    isSelected
                      ? "bg-sky-50/60 border-sky-300 dark:bg-sky-950/30 dark:border-sky-800"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <Checkbox
                      id={`fee-${key}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleFee(key)}
                      className="mt-1"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label
                          htmlFor={`fee-${key}`}
                          className="font-medium cursor-pointer text-sm"
                        >
                          {fee.studentName}
                        </Label>
                        {isAnnual ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40"
                          >
                            Annual Registration
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                          >
                            Monthly Practice
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {fee.billingPeriod}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {fee.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 shrink-0">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-24 text-right h-9"
                      value={currentAmount}
                      onChange={(e) => {
                        setFeeAmounts((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }));
                      }}
                      disabled={!isSelected}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-Month Selection Summary Bar */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t text-sm bg-muted/20 px-3 py-2 rounded-md">
            <div className="text-xs text-muted-foreground">
              <span>Selected for this invoice: </span>
              <strong className="text-foreground">
                {selectedMonthlyCount > 0 &&
                  `${selectedMonthlyCount} month${selectedMonthlyCount === 1 ? "" : "s"} practice`}
                {selectedMonthlyCount > 0 && selectedAnnualCount > 0 && " + "}
                {selectedAnnualCount > 0 && "Annual Registration"}
              </strong>
            </div>
            <div className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              Subtotal: ${subtotal.toFixed(2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
