"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface CustomLineItem {
  enrollmentId?: string;
  description: string;
  amount: number;
}

interface InvoiceCustomLineItemsProps {
  customLineItems: CustomLineItem[];
  addCustomLineItem: () => void;
  updateCustomLineItem: (
    index: number,
    field: "description" | "amount",
    value: number | string,
  ) => void;
  removeCustomLineItem: (index: number) => void;
}

export function InvoiceCustomLineItems({
  customLineItems,
  addCustomLineItem,
  updateCustomLineItem,
  removeCustomLineItem,
}: InvoiceCustomLineItemsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Custom Line Items</CardTitle>
            <CardDescription>
              Add products, discounts, or additional fees
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomLineItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {customLineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom line items added. Click &quot;Add Item&quot; to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {customLineItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-md"
              >
                <div className="flex-1">
                  <Input
                    placeholder="Description (e.g., Goggles, Sibling Discount)"
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
                <div className="flex items-center space-x-2 w-32">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
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
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
