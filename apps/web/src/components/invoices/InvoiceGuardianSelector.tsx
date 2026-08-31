"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GuardianLite } from "@/lib/api/client/guardian";

interface InvoiceGuardianSelectorProps {
  guardianSearch: string;
  setGuardianSearch: (val: string) => void;
  guardians: GuardianLite[];
  selectedGuardian: GuardianLite | null;
  setSelectedGuardian: (guardian: GuardianLite | null) => void;
  skipGuardian: boolean;
  setSkipGuardian: (val: boolean) => void;
}

export function InvoiceGuardianSelector({
  guardianSearch,
  setGuardianSearch,
  guardians,
  selectedGuardian,
  setSelectedGuardian,
  skipGuardian,
  setSkipGuardian,
}: InvoiceGuardianSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Select Guardian</CardTitle>
        <CardDescription>
          Search for the parent/guardian to bill
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedGuardian ? (
          <>
            <Input
              placeholder="Search by name, email, or phone number..."
              value={guardianSearch}
              onChange={(e) => setGuardianSearch(e.target.value)}
            />
            {guardians.length > 0 && (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {guardians.map((guardian) => (
                  <button
                    key={guardian.id}
                    type="button"
                    onClick={() => {
                      setSelectedGuardian(guardian);
                      setGuardianSearch("");
                    }}
                    className="w-full p-3 text-left hover:bg-muted transition-colors flex flex-col items-start"
                  >
                    <div className="font-medium">{guardian.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {guardian.email}
                      {guardian.phone ? ` • ${guardian.phone}` : ""}
                    </div>
                    {guardian.students && guardian.students.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Students:{" "}
                        {guardian.students
                          .map((s) => `${s.firstName} ${s.lastName}`)
                          .join(", ")}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {guardianSearch.trim().length >= 2 && guardians.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No guardians found matching &quot;{guardianSearch}&quot;
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div>
              <div className="font-medium">{selectedGuardian.fullName}</div>
              <div className="text-sm text-muted-foreground">
                {selectedGuardian.email}
                {selectedGuardian.phone ? ` • ${selectedGuardian.phone}` : ""}
              </div>
              {selectedGuardian.students &&
                selectedGuardian.students.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Students:{" "}
                    {selectedGuardian.students
                      .map((s) => `${s.firstName} ${s.lastName}`)
                      .join(", ")}
                  </div>
                )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGuardian(null)}
            >
              Change
            </Button>
          </div>
        )}
        {!selectedGuardian && !skipGuardian && (
          <div className="flex justify-center border-t pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSkipGuardian(true)}
            >
              Skip / Create Invoice without Guardian
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
