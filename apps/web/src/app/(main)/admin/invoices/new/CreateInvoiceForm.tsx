"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createInvoice,
  getUnInvoicedEnrollments,
  getInvoices,
} from "@/lib/api/client/invoice";
import { searchGuardians, GuardianLite } from "@/lib/api/client/guardian";
import { DAY_LABELS } from "@/lib/schedule/slots";
import { InvoiceGuardianSelector } from "@/components/invoices/InvoiceGuardianSelector";
import {
  InvoiceEnrollmentsPicker,
  UnInvoicedEnrollment,
} from "@/components/invoices/InvoiceEnrollmentsPicker";
import {
  InvoiceCustomLineItems,
  CustomLineItem,
} from "@/components/invoices/InvoiceCustomLineItems";

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

  const [customLineItems, setCustomLineItems] = useState<CustomLineItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [enrollmentAmounts, setEnrollmentAmounts] = useState<
    Record<string, string>
  >({});

  // Restore last used invoice date
  useEffect(() => {
    const lastDate = sessionStorage.getItem("lastInvoiceDate");
    if (lastDate) {
      setInvoiceDate(lastDate);
    }
  }, []);

  // Search guardians with debouncing & race-condition cancellation
  useEffect(() => {
    let cancel = false;
    const query = guardianSearch.trim();
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchGuardians(query);
          if (!cancel) {
            setGuardians(results || []);
          }
        } catch (error) {
          if (!cancel) {
            console.error("Failed to search guardians:", error);
          }
        }
      }, 250);
      return () => {
        cancel = true;
        clearTimeout(timer);
      };
    } else {
      setGuardians([]);
    }
  }, [guardianSearch]);

  // Auto-populate invoice number
  useEffect(() => {
    async function getNextInvoiceNumber() {
      try {
        const savedNumber = sessionStorage.getItem("lastInvoiceNumber");
        if (savedNumber) {
          const match = savedNumber.match(/^([^0-9]*)(\d+)$/);
          if (match) {
            const prefix = match[1] || "";
            const number = parseInt(match[2]);
            const nextNumber = number + 1;
            const paddedNumber = nextNumber
              .toString()
              .padStart(match[2].length, "0");
            setInvoiceNumber(`${prefix}${paddedNumber}`);
            return;
          }
        }

        const result = await getInvoices({
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
          includeAllLocations: true,
        });

        if (result.data && result.data.length > 0) {
          let matchFound = false;
          for (const lastInvoice of result.data) {
            if (lastInvoice.invoiceNumber) {
              const match = lastInvoice.invoiceNumber.match(/^([^0-9]*)(\d+)$/);
              if (match) {
                const prefix = match[1] || "";
                const number = parseInt(match[2]);
                const nextNumber = number + 1;
                const paddedNumber = nextNumber
                  .toString()
                  .padStart(match[2].length, "0");
                setInvoiceNumber(`${prefix}${paddedNumber}`);
                matchFound = true;
                break;
              }
            }
          }

          if (!matchFound) {
            setInvoiceNumber("#00001");
          }
        } else {
          setInvoiceNumber("#00001");
        }
      } catch (error) {
        console.error("Failed to fetch latest invoice number:", error);
      }
    }

    getNextInvoiceNumber();
  }, []);

  // Load enrollments when guardian selected
  useEffect(() => {
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
    field: "description" | "amount",
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
    const enrollmentTotal = enrollments
      .filter((e) => selectedEnrollments.has(e.id))
      .reduce((sum, e) => {
        const val = parseFloat(
          enrollmentAmounts[e.id] ?? e.suggestedAmount.toString(),
        );
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

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
      const lineItems: CustomLineItem[] = [];

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

      let finalCreatedAt: string | undefined;
      if (invoiceDate) {
        const todayStr = new Date().toISOString().split("T")[0];
        if (invoiceDate === todayStr) {
          finalCreatedAt = new Date().toISOString();
        } else {
          const now = new Date();
          finalCreatedAt = `${invoiceDate}T${now.toISOString().split("T")[1]}`;
        }
      }

      const invoice = await createInvoice({
        guardianId: selectedGuardian?.id,
        invoiceNumber: invoiceNumber || undefined,
        totalAmount: calculateTotal(),
        notes: notes || undefined,
        createdAt: finalCreatedAt,
        lineItems,
      });

      toast.success("Invoice created successfully");
      if (invoiceDate) {
        sessionStorage.setItem("lastInvoiceDate", invoiceDate);
      }
      if (invoice.invoiceNumber) {
        sessionStorage.setItem("lastInvoiceNumber", invoice.invoiceNumber);
      }
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
            Generate a new invoice for enrollments or custom line items
          </p>
        </div>
      </div>

      {/* Guardian Selection */}
      <InvoiceGuardianSelector
        guardianSearch={guardianSearch}
        setGuardianSearch={setGuardianSearch}
        guardians={guardians}
        selectedGuardian={selectedGuardian}
        setSelectedGuardian={setSelectedGuardian}
        skipGuardian={skipGuardian}
        setSkipGuardian={setSkipGuardian}
      />

      {(selectedGuardian || skipGuardian) && (
        <>
          {/* Uninvoiced Enrollments */}
          {selectedGuardian && (
            <InvoiceEnrollmentsPicker
              enrollments={enrollments}
              selectedEnrollments={selectedEnrollments}
              toggleEnrollment={toggleEnrollment}
              enrollmentAmounts={enrollmentAmounts}
              setEnrollmentAmounts={setEnrollmentAmounts}
            />
          )}

          {/* Custom Line Items */}
          <InvoiceCustomLineItems
            customLineItems={customLineItems}
            addCustomLineItem={addCustomLineItem}
            updateCustomLineItem={updateCustomLineItem}
            removeCustomLineItem={removeCustomLineItem}
          />

          {/* Invoice Details & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>4. Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Leave blank for auto-generation"
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
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this invoice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Total & Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold">
                    ${calculateTotal().toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </form>
  );
}
