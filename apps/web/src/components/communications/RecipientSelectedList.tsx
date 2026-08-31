"use client";

import { useState, useMemo } from "react";
import { Users, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Recipient } from "@/lib/api/client/communications";

interface RecipientSelectedListProps {
  recipients: Recipient[];
  onRemoveRecipient: (email: string) => void;
  onClearRecipients: () => void;
}

export function RecipientSelectedList({
  recipients,
  onRemoveRecipient,
  onClearRecipients,
}: RecipientSelectedListProps) {
  const [listSearch, setListSearch] = useState("");

  const filteredList = useMemo(() => {
    if (!listSearch.trim()) return recipients;
    const q = listSearch.toLowerCase().trim();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.students.some((s) => s.toLowerCase().includes(q)),
    );
  }, [recipients, listSearch]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Selected Recipients</span>
              <Badge variant="outline" className="font-semibold">
                {recipients.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and manage people who will receive this email. Remove any
              unwanted recipients before sending.
            </CardDescription>
          </div>

          {recipients.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Filter list..."
                  className="h-8 pl-9 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearRecipients}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {recipients.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50/50">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              No recipients selected yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Filter by class/term above, search for specific guardians, or type
              custom email addresses to populate this list.
            </p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto divide-y">
              {filteredList.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No recipients match &quot;{listSearch}&quot;.
                </div>
              ) : (
                filteredList.map((r) => (
                  <div
                    key={r.email}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-sm"
                  >
                    <div className="space-y-0.5 min-w-0 pr-4">
                      <div className="font-medium text-slate-900 truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {r.email}
                      </div>
                      {r.students && r.students.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          Student(s): {r.students.join(", ")}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveRecipient(r.email)}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      title={`Remove ${r.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove recipient</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="bg-slate-50 px-4 py-2 text-xs text-muted-foreground flex justify-between border-t">
              <span>
                Showing {filteredList.length} of {recipients.length} recipients
              </span>
              {listSearch && (
                <button
                  onClick={() => setListSearch("")}
                  className="text-primary hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
