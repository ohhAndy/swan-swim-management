"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInvoices, type Invoice } from "@/lib/api/invoice-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileSpreadsheet, ArrowUpDown } from "lucide-react";
import { exportInvoices } from "@/lib/api/payments";
interface Props {
  userRole: string;
}

export default function InvoicesListClient({ userRole }: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<"createdAt" | "invoiceNumber">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  async function loadInvoices() {
    try {
      setLoading(true);
      const result = await getInvoices({
        search: search || undefined,
        status: statusFilter as "paid" | "partial" | "void" | "all",
        page,
        limit: 20,
        sortBy,
        sortOrder,
      });
      setInvoices(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
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
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <Button onClick={() => router.push("/admin/invoices/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split("-") as [
              "createdAt" | "invoiceNumber",
              "asc" | "desc"
            ];
            setSortBy(field);
            setSortOrder(order);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Date: Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Date: Oldest first</SelectItem>
            <SelectItem value="invoiceNumber-desc">
              Invoice #: High to Low
            </SelectItem>
            <SelectItem value="invoiceNumber-asc">
              Invoice #: Low to High
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-600"
          onClick={async () => {
            try {
              const blob = await exportInvoices({
                status: statusFilter === "all" ? undefined : statusFilter,
                query: search || undefined,
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "invoices.xlsx";
              a.click();
            } catch (error) {
              console.error("Failed to export invoices", error);
            }
          }}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No invoices found
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber || (
                        <span className="text-muted-foreground italic">
                          No number
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.guardian?.fullName || (
                        <span className="text-muted-foreground italic">
                          No Guardian
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/invoices/${invoice.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
