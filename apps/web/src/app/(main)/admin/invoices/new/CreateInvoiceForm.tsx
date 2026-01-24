"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoice,
  getUnInvoicedEnrollments,
} from "@/lib/api/invoice-client";
import { searchGuardians } from "@/lib/api/guardian-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { GuardianLite } from "@/lib/api/guardian-client";
import { DAY_LABELS } from "@/lib/schedule/slots";

interface UnInvoicedEnrollment {
  id: string;
  classRatio: string;
  suggestedAmount: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    level: string;
  };
  offering: {
    id: string;
    weekday: number;
    startTime: string;
    term: {
      name: string;
      location?: {
        name: string;
      };
    };
  };
  enrollmentSkips: {
    id: string;
    enrollmentId: string;
    classSessionId: string;
  }[];
}

interface LineItem {
  enrollmentId?: string;
  description: string;
  amount: number;
}

export default function CreateInvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [guardians, setGuardians] = useState<GuardianLite[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianLite | null>(
    null,
  );

  const [enrollments, setEnrollments] = useState<UnInvoicedEnrollment[]>([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(
    new Set(),
  );
  const [skipGuardian, setSkipGuardian] = useState(false);

  const [customLineItems, setCustomLineItems] = useState<LineItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [notes, setNotes] = useState("");
  const [enrollmentAmounts, setEnrollmentAmounts] = useState<
    Record<string, string>
  >({});

  // Search guardians
  useEffect(() => {
    if (guardianSearch.length >= 2) {
      searchGuardians(guardianSearch).then((results) => {
        setGuardians(results || []);
      });
    } else {
      setGuardians([]);
    }
  }, [guardianSearch]);

  // Load enrollments when guardian selected
  useEffect(() => {
    if (selectedGuardian) {
      setSkipGuardian(false);
      loadEnrollments();
    } else {
      setEnrollments([]);
      setSelectedEnrollments(new Set());
    }
  }, [selectedGuardian]);

  // Reset guardian if skip is selected
  useEffect(() => {
    if (skipGuardian) {
      setSelectedGuardian(null);
    }
  }, [skipGuardian]);

  async function loadEnrollments() {
    if (!selectedGuardian) return;

    try {
      const result = await getUnInvoicedEnrollments({
        guardianId: selectedGuardian.id,
        limit: 100,
        includeAllLocations: true,
      });
      setEnrollments(result.data || []);
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      toast.error("Failed to load enrollments");
    }
  }

  function toggleEnrollment(enrollmentId: string) {
    const newSelected = new Set(selectedEnrollments);
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId);
    } else {
      newSelected.add(enrollmentId);
    }
    setSelectedEnrollments(newSelected);
  }

  function addCustomLineItem() {
    setCustomLineItems([...customLineItems, { description: "", amount: 0 }]);
  }

  function updateCustomLineItem(
    index: number,
    field: string,
    value: number | string,
  ) {
    const updated = [...customLineItems];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLineItems(updated);
  }

  function removeCustomLineItem(index: number) {
    setCustomLineItems(customLineItems.filter((_, i) => i !== index));
  }

  function calculateTotal(): number {
    // Sum selected enrollments
    const enrollmentTotal = enrollments
      .filter((e) => selectedEnrollments.has(e.id))
      .reduce((sum, e) => {
        const val = parseFloat(
          enrollmentAmounts[e.id] ?? e.suggestedAmount.toString(),
        );
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

    // Sum custom line items
    const customTotal = customLineItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return enrollmentTotal + customTotal;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedGuardian && !skipGuardian) {
      toast.error("Please select a guardian or choose to skip");
      return;
    }

    if (selectedEnrollments.size === 0 && customLineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setLoading(true);

    try {
      const lineItems: LineItem[] = [];

      // Add enrollment line items
      enrollments
        .filter((e) => selectedEnrollments.has(e.id))
        .forEach((enrollment) => {
          const desc = `${enrollment.student.firstName} ${
            enrollment.student.lastName
          } - ${DAY_LABELS[enrollment.offering.weekday]} ${
            enrollment.offering.startTime
          } ${enrollment.student.level} - ${enrollment.offering.term.name}${
            enrollment.offering.term.location?.name
              ? ` (${enrollment.offering.term.location.name})`
              : ""
          } (${enrollment.classRatio})`;
          lineItems.push({
            enrollmentId: enrollment.id,
            description: desc,
            amount:
              parseFloat(
                enrollmentAmounts[enrollment.id] ??
                  enrollment.suggestedAmount.toString(),
              ) || 0,
          });
        });

      // Add custom line items
      customLineItems.forEach((item) => {
        if (item.description && item.amount > 0) {
          lineItems.push(item);
        }
      });

      const invoice = await createInvoice({
        guardianId: selectedGuardian?.id,
        invoiceNumber: invoiceNumber || undefined,
        totalAmount: calculateTotal(),
        notes: notes || undefined,
        createdAt: invoiceDate
          ? new Date(invoiceDate).toISOString()
          : undefined,
        lineItems,
      });

      toast.success("Invoice created successfully");
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create invoice",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">
            Select enrollments and add custom items
          </p>
        </div>
      </div>

      {/* Guardian Selection */}
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
                placeholder="Search by name or email..."
                value={guardianSearch}
                onChange={(e) => setGuardianSearch(e.target.value)}
              />
              {guardians.length > 0 && (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {guardians.map((guardian) => (
                    <button
                      key={guardian.id}
                      type="button"
                      onClick={() => setSelectedGuardian(guardian)}
                      className="w-full p-3 text-left hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{guardian.fullName}</div>
                      {guardian.email && (
                        <div className="text-sm text-muted-foreground">
                          {guardian.email}
                        </div>
                      )}
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
            </>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">{selectedGuardian.fullName}</div>
                {selectedGuardian.email && (
                  <div className="text-sm text-muted-foreground">
                    {selectedGuardian.email}
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
              <Button variant="ghost" onClick={() => setSkipGuardian(true)}>
                Skip / Create Invoice without Guardian
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(selectedGuardian || skipGuardian) && (
        <>
          {/* Enrollments - Only show if Guardian Selected */}
          {selectedGuardian && (
            <Card>
              <CardHeader>
                <CardTitle>2. Select Enrollments</CardTitle>
                <CardDescription>
                  Un-invoiced enrollments for this guardian
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No un-invoiced enrollments found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedEnrollments.has(enrollment.id)}
                          onCheckedChange={() =>
                            toggleEnrollment(enrollment.id)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {DAY_LABELS[enrollment.offering.weekday]}{" "}
                            {enrollment.offering.startTime} -{" "}
                            {enrollment.student.level} -{" "}
                            {enrollment.offering.term.name}
                            {enrollment.offering.term.location?.name &&
                              ` (${enrollment.offering.term.location.name})`}
                          </div>
                          <div className="text-sm">
                            {enrollment.classRatio} •{" "}
                            {8 -
                              (enrollment.enrollmentSkips
                                ? enrollment.enrollmentSkips.length
                                : 0)}{" "}
                            weeks
                          </div>
                        </div>
                        <div className="text-right w-32">
                          <Input
                            type="number"
                            step="0.01"
                            value={
                              enrollmentAmounts[enrollment.id] ??
                              enrollment.suggestedAmount
                            }
                            onChange={(e) => {
                              setEnrollmentAmounts({
                                ...enrollmentAmounts,
                                [enrollment.id]: e.target.value,
                              });
                            }}
                            className="h-8 text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>3. Add Custom Items (Optional)</CardTitle>
              <CardDescription>
                Add fees, discounts, or other charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customLineItems.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Description (e.g., Swim cap)"
                      value={item.description}
                      onChange={(e) =>
                        updateCustomLineItem(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateCustomLineItem(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomLineItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCustomLineItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Item
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>4. Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Enter invoice number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this invoice"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
