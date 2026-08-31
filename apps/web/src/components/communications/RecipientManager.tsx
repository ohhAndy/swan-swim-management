"use client";

import { useState, useMemo } from "react";
import { Recipient } from "@/lib/api/client/communications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Filter, UserPlus, Mail, Users, Check, AlertCircle, X } from "lucide-react";
import { RecipientFilterPresets } from "./RecipientFilterPresets";
import { RecipientGuardianSearch } from "./RecipientGuardianSearch";
import { RecipientCustomEmailForm } from "./RecipientCustomEmailForm";
import { RecipientSelectedList } from "./RecipientSelectedList";

interface RecipientManagerProps {
  recipients: Recipient[];
  onAddRecipient: (recipient: Recipient) => void;
  onRemoveRecipient: (email: string) => void;
  onClearRecipients: () => void;
  onSetRecipients: (recipients: Recipient[]) => void;
  onAppendRecipients: (recipients: Recipient[]) => void;
}

export function RecipientManager({
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onClearRecipients,
  onSetRecipients,
  onAppendRecipients,
}: RecipientManagerProps) {
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const recipientEmailSet = useMemo(() => {
    return new Set(recipients.map((r) => r.email.toLowerCase()));
  }, [recipients]);

  return (
    <div className="space-y-6">
      {/* Top Card: Selection / Add Options */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                1. Select & Manage Recipients
              </CardTitle>
              <CardDescription>
                Use class filters for bulk selection, search specific guardians,
                or add custom emails directly.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
              {recipients.length} Recipient{recipients.length === 1 ? "" : "s"}{" "}
              Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && (
            <div
              className={`flex items-center justify-between p-3 rounded-md text-sm ${
                notice.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : notice.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === "success" && <Check className="h-4 w-4" />}
                {notice.type === "error" && <AlertCircle className="h-4 w-4" />}
                {notice.type === "info" && <AlertCircle className="h-4 w-4" />}
                <span>{notice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Tabs defaultValue="filter" className="w-full">
            <div className="flex items-center mb-6 overflow-x-auto pb-1">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                <TabsTrigger
                  value="filter"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <Filter className="h-4 w-4 shrink-0" />
                  <span>Filter Classes/Terms</span>
                </TabsTrigger>
                <TabsTrigger
                  value="guardian"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Search Guardian/Student</span>
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Add Custom Email</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Bulk Filters */}
            <TabsContent value="filter">
              <RecipientFilterPresets
                hasExistingRecipients={recipients.length > 0}
                onSetRecipients={onSetRecipients}
                onAppendRecipients={onAppendRecipients}
                setNotice={setNotice}
              />
            </TabsContent>

            {/* TAB 2: Search Guardian / Student */}
            <TabsContent value="guardian">
              <RecipientGuardianSearch
                recipientEmailSet={recipientEmailSet}
                onAddRecipient={onAddRecipient}
                setNotice={setNotice}
              />
            </TabsContent>

            {/* TAB 3: Add Custom Email */}
            <TabsContent value="custom">
              <RecipientCustomEmailForm
                onAddRecipient={onAddRecipient}
                setNotice={setNotice}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bottom Card: Selected Recipients Table */}
      <RecipientSelectedList
        recipients={recipients}
        onRemoveRecipient={onRemoveRecipient}
        onClearRecipients={onClearRecipients}
      />
    </div>
  );
}
