"use client";

import { useState } from "react";
import {
  Recipient,
  RecipientFilter,
  getRecipients,
  sendEmail,
} from "@/lib/api/communications-client";
import { RecipientFilterComponent } from "@/components/communications/RecipientFilter";
import { Composer } from "@/components/communications/Composer";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CommunicationsPage() {
  const [filter, setFilter] = useState<RecipientFilter>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showRecipientList, setShowRecipientList] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await getRecipients(filter);
      setRecipients(res);
      setSearched(true);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch recipients");
    } finally {
      setLoading(false);
    }
  };

  const recipientEmails = recipients.map((r) => r.email);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Email Guardians</h1>
        <p className="text-muted-foreground">
          Filter students and send specific communications to their guardians.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          {/* 1. Filter Recipients */}
          <RecipientFilterComponent
            filter={filter}
            onChange={setFilter}
            onSearch={handleSearch}
            loading={loading}
          />
        </section>

        {searched && (
          <>
            <Separator />

            <div className="mt-8">
              {/* 2. Compose Message */}
              <Composer
                title="2. Compose Message"
                recipientCount={recipients.length}
                recipientEmails={recipientEmails}
                onSend={sendEmail}
                onViewRecipients={() => setShowRecipientList(true)}
              />
            </div>

            <Dialog
              open={showRecipientList}
              onOpenChange={setShowRecipientList}
            >
              <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    Recipient List ({recipients.length})
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {recipients.length === 0 ? (
                    <p className="p-4 text-slate-500 text-sm">
                      No recipients found matching filters.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {recipients.map((r) => (
                        <li key={r.email} className="p-3 text-sm">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-slate-500 text-xs">
                            {r.email}
                          </div>
                          <div className="text-slate-400 text-xs mt-1">
                            Student(s): {r.students.join(", ")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
