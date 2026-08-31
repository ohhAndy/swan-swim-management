import React from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import type { EnrollmentData } from "./guardian-view.types";

/**
 * Calculates human-readable age string in UTC (years and months) from birthdate.
 */
export function calculateAge(birthdate?: string | null): string {
  if (!birthdate) return "Not provided";

  const birth = new Date(birthdate);
  const today = new Date();

  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  let months = today.getUTCMonth() - birth.getUTCMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (today.getUTCDate() < birth.getUTCDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  return `${years} years, ${months} months`;
}

/**
 * Helper for Invoice Status Badge on Guardian View
 */
export function getGuardianInvoiceBadge(enrollment: EnrollmentData): React.ReactNode {
  if (!enrollment.invoiceLineItem) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" />
        Not Invoiced
      </Badge>
    );
  }

  const invoice = enrollment.invoiceLineItem.invoice;

  if (invoice.status === "paid") {
    return (
      <Badge variant="default" className="flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Paid
      </Badge>
    );
  }

  if (invoice.status === "partial") {
    const paid = invoice.payments.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0,
    );
    const balance = Number(invoice.totalAmount) - paid;
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <DollarSign className="w-3 h-3 shrink-0" />
        Partial (${balance.toFixed(2)} due)
      </Badge>
    );
  }

  if (invoice.status === "void") {
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3 shrink-0" />
        Void
      </Badge>
    );
  }

  if (invoice.status === "refunded") {
    return (
      <Badge
        variant="outline"
        className="border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1 w-fit"
      >
        <RotateCcw className="w-3 h-3 shrink-0" />
        Refunded
      </Badge>
    );
  }
  return null;
}
