"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, EditableLineItem } from "./invoice-detail.utils";
import type { Invoice } from "@/lib/api/client/invoice";

interface InvoiceSummaryCardProps {
  invoice: Invoice;
  editMode: boolean;
  editInvoiceNumber: string;
  setEditInvoiceNumber: (val: string) => void;
  editDate: string;
  setEditDate: (val: string) => void;
  editStatus: "paid" | "partial" | "void" | "refunded";
  setEditStatus: (val: "paid" | "partial" | "void" | "refunded") => void;
  editNotes: string;
  setEditNotes: (val: string) => void;
  editLineItems: EditableLineItem[];
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function InvoiceSummaryCard({
  invoice,
  editMode,
  editInvoiceNumber,
  setEditInvoiceNumber,
  editDate,
  setEditDate,
  editStatus,
  setEditStatus,
  editNotes,
  setEditNotes,
  editLineItems,
  onSaveEdit,
  onCancelEdit,
}: InvoiceSummaryCardProps) {
  const currentTotal = editMode
    ? editLineItems.reduce(
        (sum, i) => sum + (parseFloat(i.amount) || 0),
        0,
      )
    : invoice.totalAmount;

  const currentBalance = editMode
    ? Math.max(
        0,
        editLineItems.reduce(
          (sum, i) => sum + (parseFloat(i.amount) || 0),
          0,
        ) - invoice.amountPaid,
      )
    : invoice.balance;

  return (
    <div className="space-y-6">
      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(invoice.amountPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(currentBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form Card */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editInvoiceNumber">Invoice Number</Label>
                <Input
                  id="editInvoiceNumber"
                  value={editInvoiceNumber}
                  onChange={(e) => setEditInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <Label htmlFor="editDate">Invoice Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editStatus}
                onValueChange={(v) =>
                  setEditStatus(v as "paid" | "partial" | "void" | "refunded")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSaveEdit}>Save Changes</Button>
              <Button variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function InvoiceMetadataCard({ invoice }: { invoice: Invoice }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created:</span>
          <span>{formatDate(invoice.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Updated:</span>
          <span>{formatDate(invoice.updatedAt)}</span>
        </div>
        {invoice.notes && (
          <div>
            <span className="text-muted-foreground">Notes:</span>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
