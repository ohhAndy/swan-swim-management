import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import type { Enrollment } from "@/lib/types/models";

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
 * Determines whether a user role can view or edit a specific report card.
 */
export function canViewReportCard(
  rc: NonNullable<Enrollment["reportCards"]>[number],
  userRole?: string,
  staffUserId?: string,
): boolean {
  if (userRole === "super_admin" || userRole === "admin" || userRole === "manager") {
    return true;
  }
  if (userRole === "supervisor") {
    return rc.createdBy === staffUserId;
  }
  return false;
}

/**
 * Generates payment status badge for an enrollment based on user role and linked invoice.
 */
export function getInvoiceStatusBadge(
  enrollment: Enrollment,
  userRole: string,
): React.ReactNode {
  if (userRole === "supervisor") {
    return null;
  }

  if (!enrollment.invoiceLineItem) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Not Invoiced
      </Badge>
    );
  }

  const invoice = enrollment.invoiceLineItem.invoice;
  if (!invoice) {
    return null;
  }

  const isAdminOrSuperAdmin = userRole === "super_admin" || userRole === "admin";
  let badgeContent: React.ReactNode = null;

  if (invoice.status === "paid") {
    badgeContent = (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Paid
      </Badge>
    );
  } else if (invoice.status === "partial") {
    const paid = invoice.payments.reduce((acc, payment) => acc + payment.amount, 0);
    const balance = invoice.totalAmount - paid;
    badgeContent = (
      <Badge variant="outline" className="flex items-center gap-1">
        <DollarSign className="w-3 h-3 shrink-0" />
        Partial (${balance.toFixed(2)} due)
      </Badge>
    );
  } else if (invoice.status === "void") {
    badgeContent = (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        Void
      </Badge>
    );
  } else if (invoice.status === "refunded") {
    badgeContent = (
      <Badge
        variant="outline"
        className="border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1"
      >
        <RotateCcw className="w-3 h-3 shrink-0" />
        Refunded
      </Badge>
    );
  }

  if (badgeContent && isAdminOrSuperAdmin) {
    return (
      <Link
        href={`/invoices/${invoice.id}`}
        className="hover:opacity-80 transition-opacity"
      >
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
}
