"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommunicationLogItem,
  getCommunicationHistory,
} from "@/lib/api/client/communications";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommunicationDetailsDialog } from "./CommunicationDetailsDialog";
import {
  Search,
  RefreshCw,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function CommunicationHistory() {
  const [items, setItems] = useState<CommunicationLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<CommunicationLogItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCommunicationHistory({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load communication history", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenDetails = (log: CommunicationLogItem) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 capitalize">
            Delivered
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 capitalize">
            Sent
          </Badge>
        );
      case "bounced":
      case "failed":
        return (
          <Badge variant="destructive" className="capitalize">
            {status}
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" className="text-amber-700 bg-amber-50 border-amber-200 capitalize">
            Partial
          </Badge>
        );
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Sent Communications History
              </CardTitle>
              <CardDescription>
                Track delivery statuses, recipient logs, errors, and bounce reports for all sent communications.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHistory()}
              disabled={loading}
              className="gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls: Search & Status filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by subject or content..."
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* History Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-[180px]">Date Sent</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[160px]">Sent By</TableHead>
                  <TableHead className="w-[150px]">Recipients</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      Loading communication history...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Inbox className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-700">No sent emails found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Emails you compose and send will automatically be logged here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((log) => {
                    const formattedDate = new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-slate-50/80"
                        onClick={() => handleOpenDetails(log)}
                      >
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {formattedDate}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 line-clamp-1">
                            {log.subject}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {log.body}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {log.staff?.fullName || log.staff?.email || "System"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-slate-800">
                            {log.recipientCount} total
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {log.successCount} sent
                            {log.failureCount > 0 && (
                              <span className="text-red-600 font-semibold ml-1">
                                ({log.failureCount} failed)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(log);
                            }}
                            className="h-8 gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} records
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <CommunicationDetailsDialog
        log={selectedLog}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
