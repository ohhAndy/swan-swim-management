"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import type { GuardianLite } from "@/lib/api/client/guardian";
import { GuardianCreateModal } from "./GuardianCreateModal";
import { useEffect, useState } from "react";
import { useGuardianSearch } from "@/hooks/useGuardianSearch";

export function GuardianPicker(props: {
  value: string | null;
  onChange: (guardian: GuardianLite | null) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;
  const [q, setQ] = useState("");
  const { results, loading, error: err } = useGuardianSearch(q);
  const [picked, setPicked] = useState<GuardianLite | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    if (!value) setPicked(null);
  }, [value]);

  function pick(guardian: GuardianLite) {
    setPicked(guardian);
    setQ("");
    onChange(guardian);
  }

  function clear() {
    setPicked(null);
    setQ("");
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guardian by name / email / phone..."
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={clear}
          disabled={disabled}
        >
          Clear
        </Button>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button type="button" variant="default" disabled={disabled}>
              + New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Guardian</DialogTitle>
            </DialogHeader>
            <GuardianCreateModal
              onCancel={() => setOpenCreate(false)}
              onCreated={(g) => {
                setOpenCreate(false);
                pick(g);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {picked && (
        <div className="rounded border bg-slate-50 px-3 py-2 text-sm">
          <div className="font-medium">{picked.fullName}</div>
          <div className="text-slate-600">
            {picked.email} - {picked.phone}
          </div>
        </div>
      )}

      {loading && <div className="text-xs text-slate-500">Searching...</div>}
      {err && <div className="text-xs text-red-600">{err}</div>}

      {!picked && results.length > 0 && (
        <div className="max-h-56 overflow-auto rounded border">
          {results.map((g) => (
            <button
              key={g.id}
              type="button"
              className="flex w-full flex-col items-start border-b px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => pick(g)}
              disabled={disabled}
            >
              <span className="font-medium">{g.fullName}</span>
              <span className="text-xs text-slate-600">
                {g.email} - {g.phone}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
