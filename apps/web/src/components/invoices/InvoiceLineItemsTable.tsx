"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, EditableLineItem } from "./invoice-detail.utils";
import type { Invoice } from "@/lib/api/client/invoice";

interface InvoiceLineItemsTableProps {
  invoice: Invoice;
  editMode: boolean;
  editLineItems: EditableLineItem[];
  setEditLineItems: (items: EditableLineItem[]) => void;
}

export function InvoiceLineItemsTable({
  invoice,
  editMode,
  editLineItems,
  setEditLineItems,
}: InvoiceLineItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {editMode && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(editMode ? editLineItems : invoice.lineItems).map(
              (item, idx) => (
                <TableRow key={item.id || idx}>
                  <TableCell>
                    {editMode ? (
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...editLineItems];
                          updated[idx] = {
                            ...updated[idx],
                            description: e.target.value,
                          };
                          setEditLineItems(updated);
                        }}
                      />
                    ) : item.enrollment ? (
                      <Link
                        href={`/term/${item.enrollment.offering.term.id}/schedule/weekday/${item.enrollment.offering.weekday}/slot/${item.enrollment.offering.startTime}-${item.enrollment.offering.endTime}?highlight=${item.enrollment.offering.id}`}
                        className="flex items-center gap-1 hover:underline text-blue-600"
                      >
                        {item.description}
                      </Link>
                    ) : (
                      item.description
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="text-right max-w-[150px] ml-auto"
                        value={item.amount}
                        onChange={(e) => {
                          const updated = [...editLineItems];
                          updated[idx] = {
                            ...updated[idx],
                            amount: e.target.value,
                          };
                          setEditLineItems(updated);
                        }}
                      />
                    ) : (
                      formatCurrency(
                        typeof item.amount === "string"
                          ? parseFloat(item.amount)
                          : item.amount,
                      )
                    )}
                  </TableCell>
                  {editMode && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditLineItems(
                            editLineItems.filter((_, i) => i !== idx),
                          );
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
        {editMode && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditLineItems([
                  ...editLineItems,
                  {
                    id: `temp-${Date.now()}`,
                    description: "New Item",
                    amount: "0",
                  } as EditableLineItem,
                ]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
