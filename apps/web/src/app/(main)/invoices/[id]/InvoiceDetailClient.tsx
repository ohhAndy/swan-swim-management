"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  createPayment,
  deletePayment,
  type Invoice,
  type InvoiceLineItem,
} from "@/lib/api/invoice-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Edit form state
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"paid" | "partial" | "void">(
    "partial"
  );
  const [editDate, setEditDate] = useState("");

  // Use string for amount to allow easy decimal editing
  interface EditableLineItem extends Omit<InvoiceLineItem, "amount"> {
    amount: string;
  }
  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([]);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "debit" | "visa" | "mastercard" | "etransfer" | "website" | "other"
  >("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

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
        }))
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
        createdAt: editDate ? new Date(editDate).toISOString() : undefined,
        lineItems: editLineItems.map((item) => ({
          id: item.id.startsWith("temp-") ? undefined : item.id,
          enrollmentId: item.enrollmentId,
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
        error instanceof Error ? error.message : "Failed to update invoice"
      );
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > invoice.balance) {
      toast.error(
        `Payment cannot exceed balance of $${invoice.balance.toFixed(2)}`
      );
      return;
    }

    setSubmittingPayment(true);

    try {
      await createPayment({
        invoiceId: invoice.id,
        amount,
        paymentDate,
        paymentMethod,
        notes: paymentNotes || undefined,
      });
      toast.success("Payment recorded");
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentNotes("");
      loadInvoice();
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    try {
      await deletePayment(paymentId);
      toast.success("Payment deleted");
      loadInvoice();
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast.error("Failed to delete payment");
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

  function getStatusBadge(status: string) {
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

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  if (loading) {
    return <div className="text-center py-8">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-8">Invoice not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {getStatusBadge(invoice.status)}
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
          {userRole === "admin" && (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                editMode
                  ? editLineItems.reduce(
                      (sum, i) => sum + (parseFloat(i.amount) || 0),
                      0
                    )
                  : invoice.totalAmount
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {/* Recalculate if editing, otherwise use saved */}
              {formatCurrency(
                editMode
                  ? editLineItems.reduce(
                      (sum, i) => sum + (parseFloat(i.amount) || 0),
                      0
                    ) -
                      (invoice.amountPaid || 0) <
                    0 // Handle potentially negative balance display logic if needed (paid > total)
                    ? invoice.amountPaid // Keep paid consistent
                    : invoice.amountPaid
                  : invoice.amountPaid
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(
                editMode
                  ? Math.max(
                      0,
                      editLineItems.reduce(
                        (sum, i) => sum + (parseFloat(i.amount) || 0),
                        0
                      ) - invoice.amountPaid
                    )
                  : invoice.balance
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
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
                  setEditStatus(v as "paid" | "partial" | "void")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
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
              <Button onClick={handleSaveEdit}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {editMode && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(editMode ? editLineItems : invoice.lineItems).map(
                (item, idx) => (
                  <TableRow key={item.id || idx}>
                    <TableCell>
                      {editMode ? (
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...editLineItems];
                            updated[idx] = {
                              ...updated[idx],
                              description: e.target.value,
                            };
                            setEditLineItems(updated);
                          }}
                        />
                      ) : (
                        item.description
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editMode ? (
                        <Input
                          type="number"
                          className="text-right max-w-[150px] ml-auto"
                          value={item.amount}
                          onChange={(e) => {
                            const updated = [...editLineItems];
                            updated[idx] = {
                              ...updated[idx],
                              amount: e.target.value,
                            };
                            setEditLineItems(updated);
                          }}
                        />
                      ) : (
                        formatCurrency(
                          typeof item.amount === "string"
                            ? parseFloat(item.amount)
                            : item.amount
                        )
                      )}
                    </TableCell>
                    {editMode && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditLineItems(
                              editLineItems.filter((_, i) => i !== idx)
                            );
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
          {editMode && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditLineItems([
                    ...editLineItems,
                    {
                      id: `temp-${Date.now()}`,
                      description: "New Item",
                      amount: "0",
                    } as EditableLineItem,
                  ]);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {invoice.payments.length} payment(s) recorded
              </CardDescription>
            </div>
            {invoice.balance > 0 && invoice.status !== "void" && (
              <Dialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
              >
                <Button
                  onClick={() => {
                    setPaymentAmount(invoice.balance.toString());
                    setPaymentDate(
                      new Date(invoice.createdAt).toISOString().split("T")[0]
                    );
                    setShowPaymentDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Balance due: {formatCurrency(invoice.balance)}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                      <Label htmlFor="paymentAmount">Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentDate">Payment Date</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) =>
                          setPaymentMethod(
                            v as
                              | "cash"
                              | "debit"
                              | "visa"
                              | "mastercard"
                              | "etransfer"
                              | "website"
                              | "other"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="etransfer">E-Transfer</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                      <Textarea
                        id="paymentNotes"
                        placeholder="e.g., Check #1234"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPaymentDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingPayment}>
                        {submittingPayment ? "Recording..." : "Record Payment"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payments recorded yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                  {userRole === "admin" && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.paymentMethod}
                    </TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                    {userRole === "admin" && (
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Payment?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove this payment record and update
                                the invoice balance.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePayment(payment.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Metadata */}
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
    </div>
  );
}
