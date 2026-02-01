"use client";

import { useEffect, useState } from "react";
import {
  getAllPayments,
  exportPayments,
  type Payment,
  type PaginatedResponse,
} from "@/lib/api/payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getLocations, Location } from "@/lib/api/location-client";
import EditInvoiceDialog from "@/components/invoices/EditInvoiceDialog";
import { Invoice } from "@/lib/api/invoice-client";

export default function PaymentHistoryClient() {
  const [data, setData] = useState<PaginatedResponse<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Location & Edit state
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingPaymentInvoice, setEditingPaymentInvoice] =
    useState<Invoice | null>(null);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
  }, []);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [method, setMethod] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const res = await getAllPayments({
          page,
          limit,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          method: method === "all" ? undefined : method,
          query: debouncedSearch || undefined,
        });
        setData(res);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [page, startDate, endDate, method, debouncedSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, method, debouncedSearch]);

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (data && page < data.meta.totalPages) setPage((p) => p + 1);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMethod("all");
    setSearch("");
  };

  const hasFilters =
    startDate !== "" || endDate !== "" || method !== "all" || search !== "";

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Recent Payments</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <Input
            className="w-[200px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice #"
          />

          {/* Native Date Input: Start */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-[150px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <span className="text-muted-foreground">-</span>
            {/* Native Date Input: End */}
            <Input
              type="date"
              className="w-[150px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>

          {/* Method Select */}
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
              <SelectItem value="visa">Visa</SelectItem>
              <SelectItem value="mastercard">Mastercard</SelectItem>
              <SelectItem value="etransfer">e-Transfer</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Clear Filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-600"
            onClick={async () => {
              try {
                const blob = await exportPayments({
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  method: method === "all" ? undefined : method,
                  query: debouncedSearch || undefined,
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "payments.xlsx";
                a.click();
              } catch (error) {
                console.error("Failed to export payments", error);
              }
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No payments found matching your filters.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Notes</TableHead>

                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{payment.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        {payment.invoice.location?.name || (
                          <span className="text-muted-foreground italic">
                            All Locations
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.invoice.guardian?.fullName || (
                          <span className="text-muted-foreground italic">
                            No Guardian
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/invoices/${payment.invoice.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {payment.invoice.invoiceNumber || "N/A"}
                        </a>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={payment.notes || ""}
                      >
                        {payment.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            // Cast the partial invoice to full Invoice for the dialog
                            // The dialog only uses id, invoiceNumber, location, and notes
                            const partialInvoice = {
                              id: payment.invoice.id,
                              invoiceNumber:
                                payment.invoice.invoiceNumber || undefined,
                              location: payment.invoice.location,
                              notes: payment.invoice.notes || undefined,
                              // Add dummy values for required fields not used by dialog
                              totalAmount: 0,
                              status: "paid" as const,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              lineItems: [],
                              payments: [],
                              amountPaid: 0,
                              balance: 0,
                              calculatedStatus: "paid" as const,
                            };
                            setEditingPaymentInvoice(partialInvoice as Invoice);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} (
                {data.meta.total} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={page >= data.meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {editingPaymentInvoice && (
        <EditInvoiceDialog
          open={!!editingPaymentInvoice}
          onOpenChange={(open) => !open && setEditingPaymentInvoice(null)}
          invoice={editingPaymentInvoice}
          locations={locations}
          onSuccess={() => {
            // Refresh payments to show updated location
            setPage((p) => (p === 1 ? 1.0001 : 1)); // Hack to trigger effect
            // Actually better to just refetch directly or extract fetch function
            window.location.reload(); // Simplest way to ensure everything updates
          }}
        />
      )}
    </Card>
  );
}
