"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Recipient } from "@/lib/api/client/communications";

interface RecipientCustomEmailFormProps {
  onAddRecipient: (recipient: Recipient) => void;
  setNotice: (
    notice: { type: "success" | "error" | "info"; message: string } | null,
  ) => void;
}

export function RecipientCustomEmailForm({
  onAddRecipient,
  setNotice,
}: RecipientCustomEmailFormProps) {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEmailError, setCustomEmailError] = useState<string | null>(null);

  const handleAddCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomEmailError(null);

    const email = customEmail.trim();
    if (!email) {
      setCustomEmailError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCustomEmailError("Please enter a valid email address.");
      return;
    }

    const name = customName.trim() || email;
    const newRecipient: Recipient = {
      name,
      email,
      students: [],
    };

    onAddRecipient(newRecipient);
    setCustomEmail("");
    setCustomName("");
    setNotice({
      type: "success",
      message: `Added ${email} to recipient list.`,
    });
  };

  return (
    <form onSubmit={handleAddCustomEmail} className="space-y-4 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="custom-email">Email Address *</Label>
          <Input
            id="custom-email"
            type="email"
            placeholder="e.g. parent@example.com"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-name">Display Name (Optional)</Label>
          <Input
            id="custom-name"
            type="text"
            placeholder="e.g. Jane Doe"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>
      </div>

      {customEmailError && (
        <p className="text-xs text-red-600">{customEmailError}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Email
        </Button>
      </div>
    </form>
  );
}
