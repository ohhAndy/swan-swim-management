"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  type Invoice,
} from "@/lib/api/client/invoice";
import {
  getInvoiceStatusBadge,
  EditableLineItem,
} from "@/components/invoices/invoice-detail.utils";
import {
  InvoiceSummaryCard,
  InvoiceMetadataCard,
} from "@/components/invoices/InvoiceSummaryCard";
import { InvoiceLineItemsTable } from "@/components/invoices/InvoiceLineItemsTable";
import { InvoicePaymentsTable } from "@/components/invoices/InvoicePaymentsTable";
import { toast } from "sonner";

interface Props {
  invoiceId: string;
  userRole: string;
}

export default function InvoiceDetailClient({ invoiceId, userRole }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"paid" | "partial" | "void" | "refunded">(
    "partial",
  );
  const [editDate, setEditDate] = useState("");
  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([]);

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);
      const data = await getInvoice(invoiceId);
      setInvoice(data);
      setEditInvoiceNumber(data.invoiceNumber || "");
      setEditNotes(data.notes || "");
      setEditStatus(data.status);
      setEditDate(new Date(data.createdAt).toISOString().split("T")[0]);
      setEditLineItems(
        data.lineItems.map((item) => ({
          ...item,
          amount: item.amount.toString(),
        })),
      );
    } catch (error) {
      console.error("Failed to load invoice:", error);
      toast.error("Failed to load invoice");
      router.push("/invoices");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!invoice) return;

    try {
      await updateInvoice(invoice.id, {
        invoiceNumber: editInvoiceNumber || undefined,
        notes: editNotes || undefined,
        status: editStatus,
        createdAt:
          editDate && invoice
            ? `${editDate}T${new Date(invoice.createdAt).toISOString().split("T")[1] || "00:00:00.000Z"}`
            : undefined,
        lineItems: editLineItems.map((item) => ({
          id: item.id.startsWith("temp-") ? undefined : item.id,
          enrollmentId: item.enrollmentId ?? undefined,
          description: item.description,
          amount: parseFloat(item.amount) || 0,
        })),
      });
      toast.success("Invoice updated");
      setEditMode(false);
      loadInvoice();
    } catch (error) {
      console.error("Failed to update invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update invoice",
      );
    }
  }

  async function handleDeleteInvoice() {
    if (!invoice) return;

    try {
      await deleteInvoice(invoice.id);
      toast.success("Invoice deleted");
      router.push("/invoices");
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice");
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-8">Invoice not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Navigation & Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/invoices")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground">
              {invoice.guardian?.fullName || (
                <span className="italic">No Guardian</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getInvoiceStatusBadge(invoice.status)}
          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {(userRole === "admin" || userRole === "super_admin") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the invoice and all associated
                    payments. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteInvoice}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary Cards & Edit Form */}
      <InvoiceSummaryCard
        invoice={invoice}
        editMode={editMode}
        editInvoiceNumber={editInvoiceNumber}
        setEditInvoiceNumber={setEditInvoiceNumber}
        editDate={editDate}
        setEditDate={setEditDate}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        editLineItems={editLineItems}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditMode(false)}
      />

      {/* Line Items Table */}
      <InvoiceLineItemsTable
        invoice={invoice}
        editMode={editMode}
        editLineItems={editLineItems}
        setEditLineItems={setEditLineItems}
      />

      {/* Payments History Table */}
      <InvoicePaymentsTable
        invoice={invoice}
        userRole={userRole}
        onRefresh={loadInvoice}
      />

      {/* Metadata Card */}
      <InvoiceMetadataCard invoice={invoice} />
    </div>
  );
}
