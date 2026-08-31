"use client";

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchGuardians, GuardianLite } from "@/lib/api/client/guardian";
import { Recipient } from "@/lib/api/client/communications";

interface RecipientGuardianSearchProps {
  recipientEmailSet: Set<string>;
  onAddRecipient: (recipient: Recipient) => void;
  setNotice: (
    notice: { type: "success" | "error" | "info"; message: string } | null,
  ) => void;
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function RecipientGuardianSearch({
  recipientEmailSet,
  onAddRecipient,
  setNotice,
}: RecipientGuardianSearchProps) {
  const [guardianQuery, setGuardianQuery] = useState("");
  const debouncedGuardianQuery = useDebounced(guardianQuery, 300);
  const [guardianSearching, setGuardianSearching] = useState(false);
  const [guardianResults, setGuardianResults] = useState<GuardianLite[]>([]);
  const [guardianError, setGuardianError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!debouncedGuardianQuery.trim()) {
        setGuardianResults([]);
        return;
      }
      try {
        setGuardianError(null);
        setGuardianSearching(true);
        const items = await searchGuardians(debouncedGuardianQuery.trim());
        if (!cancel) setGuardianResults(items);
      } catch (e) {
        if (!cancel) {
          setGuardianError(
            e instanceof Error ? e.message : "Failed to search guardians",
          );
        }
      } finally {
        if (!cancel) setGuardianSearching(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [debouncedGuardianQuery]);

  const handleAddGuardian = (guardian: GuardianLite) => {
    if (!guardian.email) {
      setNotice({
        type: "error",
        message: `Guardian ${guardian.fullName} does not have an email address on file.`,
      });
      return;
    }

    const studentNames =
      guardian.students?.map((s) => `${s.firstName} ${s.lastName}`) || [];

    const newRecipient: Recipient = {
      id: guardian.id,
      name: guardian.fullName,
      email: guardian.email.trim(),
      students: studentNames,
    };

    onAddRecipient(newRecipient);
    setGuardianQuery("");
    setGuardianResults([]);
    setNotice({
      type: "success",
      message: `Added ${guardian.fullName} (${guardian.email}) to recipient list.`,
    });
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={guardianQuery}
          onChange={(e) => setGuardianQuery(e.target.value)}
          placeholder="Search by guardian name, email, phone, or student name..."
          className="pl-9"
        />
      </div>

      {guardianSearching && (
        <div className="text-xs text-muted-foreground py-2">
          Searching guardians...
        </div>
      )}
      {guardianError && (
        <div className="text-xs text-red-600 py-1">{guardianError}</div>
      )}

      {guardianResults.length > 0 && (
        <div className="border rounded-md divide-y max-h-60 overflow-y-auto bg-card shadow-sm">
          {guardianResults.map((g) => {
            const isAlreadyAdded = recipientEmailSet.has(
              g.email?.toLowerCase(),
            );
            return (
              <div
                key={g.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {g.fullName}
                    {isAlreadyAdded && (
                      <Badge variant="secondary" className="text-xs">
                        Already added
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{g.email || "No email"}</span>
                    {g.phone && <span>• {g.phone}</span>}
                  </div>
                  {g.students && g.students.length > 0 && (
                    <div className="text-xs text-slate-500">
                      Student(s):{" "}
                      {g.students
                        .map((s) => `${s.firstName} ${s.lastName}`)
                        .join(", ")}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={isAlreadyAdded ? "secondary" : "default"}
                  disabled={!g.email || isAlreadyAdded}
                  onClick={() => handleAddGuardian(g)}
                  className="gap-1 ml-4 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {isAlreadyAdded ? "Added" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!guardianSearching &&
        debouncedGuardianQuery.trim() &&
        guardianResults.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-slate-50">
            No guardians found matching &quot;{debouncedGuardianQuery}&quot;.
          </div>
        )}
    </div>
  );
}
