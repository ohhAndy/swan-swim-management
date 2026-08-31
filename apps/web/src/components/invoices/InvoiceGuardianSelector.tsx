"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <CardTitle>Guardian</CardTitle>
        <CardDescription>
          Select the guardian responsible for this invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!skipGuardian && (
          <div>
            <Label htmlFor="guardianSearch">Search Guardian</Label>
            <Input
              id="guardianSearch"
              placeholder="Type to search by name or email..."
              value={guardianSearch}
              onChange={(e) => setGuardianSearch(e.target.value)}
              disabled={!!selectedGuardian}
            />
            {guardians.length > 0 && !selectedGuardian && (
              <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedGuardian(guardian);
                      setGuardianSearch("");
                    }}
                  >
                    <div>
                      <p className="font-medium">{guardian.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {guardian.email} • {guardian.phone}
                      </p>
                      {guardian.students && guardian.students.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Children:{" "}
                          {guardian.students
                            .map((s) => `${s.firstName} ${s.lastName}`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {selectedGuardian && (
              <div className="mt-2 p-3 bg-muted rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedGuardian.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedGuardian.email} • {selectedGuardian.phone}
                  </p>
                  {selectedGuardian.students &&
                    selectedGuardian.students.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Children:{" "}
                        {selectedGuardian.students
                          .map((s) => `${s.firstName} ${s.lastName}`)
                          .join(", ")}
                      </p>
                    )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedGuardian(null)}
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="skipGuardian"
            checked={skipGuardian}
            onCheckedChange={(checked) => setSkipGuardian(checked as boolean)}
          />
          <Label htmlFor="skipGuardian" className="cursor-pointer text-sm">
            Create invoice without assigning a guardian
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
