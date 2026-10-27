"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";

interface OfferingDialogProps {
  initialTitle: string;
  initialType?: "regular" | "flexible" | "practice";
  triggerLabel: string;
  onSave: (
    title: string,
    type?: "regular" | "flexible" | "practice",
  ) => Promise<void>;
}

export default function OfferingDialog({
  initialTitle,
  initialType = "regular",
  triggerLabel,
  onSave,
}: OfferingDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle || "");
  const [type, setType] = useState<"regular" | "flexible" | "practice">(
    initialType || "regular",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(title, type);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save class info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTitle(initialTitle || "");
      setType(initialType || "regular");
    }
    setOpen(newOpen);
  };

  const hasChanges =
    title !== (initialTitle || "") || type !== (initialType || "regular");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {triggerLabel}
          <Edit className="w-3.5 h-3.5 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Class Information</DialogTitle>
          <DialogDescription>
            Update the title or switch between Regular Class and Team Practice.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="offeringType">Offering Type</Label>
            {initialType === "flexible" ? (
              <div className="text-sm font-medium text-muted-foreground bg-muted p-2 rounded-md">
                Flexible / Short Course (Custom Sessions)
              </div>
            ) : (
              <Select
                value={type}
                onValueChange={(val: "regular" | "practice") => setType(val)}
              >
                <SelectTrigger id="offeringType">
                  <SelectValue placeholder="Select offering type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Term Class</SelectItem>
                  <SelectItem value="practice">
                    Practice / Swim Team (Deck Check-In)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter new title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
