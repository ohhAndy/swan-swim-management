"use client";

import { useState, useMemo } from "react";
import { CommunicationLogItem } from "@/lib/api/client/communications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Mail, User, Calendar, Paperclip } from "lucide-react";

interface CommunicationDetailsDialogProps {
  log: CommunicationLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunicationDetailsDialog({
  log,
  open,
  onOpenChange,
}: CommunicationDetailsDialogProps) {
  const [recipientSearch, setRecipientSearch] = useState("");

  const filteredRecipients = useMemo(() => {
    if (!log || !log.recipients) return [];
    if (!recipientSearch.trim()) return log.recipients;
    const q = recipientSearch.toLowerCase().trim();
    return log.recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.error && r.error.toLowerCase().includes(q)) ||
        (r.resendId && r.resendId.toLowerCase().includes(q)),
    );
  }, [log, recipientSearch]);

  if (!log) return null;

  const formattedDate = new Date(log.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader className="pb-2 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>{log.subject}</span>
              </DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Sent by {log.staff?.fullName || log.staff?.email || "System"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
                {log.attachmentCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {log.attachmentCount} attachment(s)
                  </span>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge(log.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Message Body Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message Content
            </h4>
            <div className="p-4 rounded-md border bg-slate-50/50 text-sm whitespace-pre-wrap font-sans text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
              {log.body}
            </div>
          </div>

          {/* Recipients Delivery Status Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recipient Delivery Status ({log.recipientCount} total, {log.successCount} sent, {log.failureCount} failed)
              </h4>

              {log.recipients && log.recipients.length > 5 && (
                <div className="relative w-48 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Search recipients..."
                    className="h-8 pl-9 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="border rounded-md divide-y overflow-hidden max-h-64 overflow-y-auto">
              {filteredRecipients.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No recipients found.
                </div>
              ) : (
                filteredRecipients.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="font-medium text-slate-900 font-mono truncate">
                        {r.email}
                      </div>
                      {r.error ? (
                        <div className="text-xs text-red-600 truncate">
                          Error: {r.error}
                        </div>
                      ) : r.resendId ? (
                        <div className="text-xs text-slate-400 font-mono truncate">
                          Resend ID: {r.resendId}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {getStatusBadge(r.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
