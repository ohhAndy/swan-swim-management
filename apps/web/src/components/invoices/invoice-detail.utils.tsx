import React from "react";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import type { Invoice } from "@/lib/api/client/invoice";

export interface EditableLineItem extends Omit<Invoice["lineItems"][0], "amount"> {
  amount: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getInvoiceStatusBadge(status: string): React.ReactNode {
  if (status === "refunded") {
    return (
      <Badge
        variant="outline"
        className="border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1 w-fit hover:bg-purple-100"
      >
        <RotateCcw className="w-3 h-3 shrink-0" />
        REFUNDED
      </Badge>
    );
  }
  const variants = {
    paid: "default",
    partial: "secondary",
    void: "destructive",
  };
  return (
    <Badge
      variant={
        variants[status as keyof typeof variants] as
          | "default"
          | "secondary"
          | "destructive"
      }
      className="hover:bg-gray-300"
    >
      {status.toUpperCase()}
    </Badge>
  );
}
