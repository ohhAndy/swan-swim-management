"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchStudents, StudentLite } from "@/lib/api/students-client";
import { scheduleMakeUp } from "@/lib/api/schedule-client";
import type { RosterResponse } from "@school/shared-types";

interface ScheduleMakeupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null; // ISO date string like "2024-09-15T04:00:00.000Z"
  rosters: RosterResponse[];
  onSuccess: () => void;
}

function calcAge(birthdateString: string): number {
  const birthdate = new Date(birthdateString);
  const today = new Date();

  let age = today.getFullYear() - birthdate.getFullYear();

  const hadBirthdayThisYear =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() &&
      today.getDate() >= birthdate.getDate());

  if (!hadBirthdayThisYear) age--;

  return age;
}

export function ScheduleMakeupDialog({
  open,
  onOpenChange,
  selectedDate,
  rosters,
  onSuccess,
}: ScheduleMakeupDialogProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StudentLite[]>([]);
  const [picked, setPicked] = useState<StudentLite | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setPicked(null);
      setErr(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();

        if (document.activeElement?.tagName === "INPUT" && q.trim()) {
          doSearch();
        } else if (picked && !loading) {
          submit();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, q, picked, loading]);

  async function doSearch() {
    try {
      setErr(null);
      const r = await searchStudents({ query: q });
      setResults(r.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed");
    }
  }

  async function submit() {
    if (!picked || !selectedDate) return;

    try {
      setLoading(true);
      setErr(null);

      // Find the session ID for the selected date
      const sessionForDate = rosters.find(
        (r) => r.session.date.slice(0, 10) + "T04:00:00.000Z" === selectedDate,
      );

      if (!sessionForDate) {
        throw new Error("No session found for selected date");
      }

      await scheduleMakeUp({
        studentId: picked.id,
        classSessionId: sessionForDate.session.id,
      });

      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Make-up scheduling failed");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-CA");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Schedule Make-up {selectedDate && `- ${formatDate(selectedDate)}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Search */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search student..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              <Button type="button" variant="outline" onClick={doSearch}>
                Search
              </Button>
            </div>

            <div className="max-h-48 overflow-auto rounded border">
              {results.map((r) => (
                <button
                  key={r.id}
                  className={`flex w-full items-center justify-between border-b px-3 py-2 text-left hover:bg-slate-50 ${picked?.id === r.id ? "bg-slate-100" : ""}`}
                  onClick={() => setPicked(r)}
                >
                  <span className="font-medium">
                    {r.firstName} {r.lastName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {r.level ?? ""} - {r.birthdate ? calcAge(r.birthdate) : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!picked || loading}>
            {loading ? "Scheduling..." : "Schedule Make-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
