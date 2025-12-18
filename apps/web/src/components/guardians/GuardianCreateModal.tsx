"use client";

import { createGuardian } from "@/lib/api/guardian-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const phoneRegex = /^\d{3}[-\s]\d{3}[-\s]\d{4}$/;
const postalCodeRegex = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;


const addressSchema = z.object({
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  unit: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required").regex(postalCodeRegex, "Invalid Postal Code (Ex: A1A 1A1)"),
  countryCode: z
    .string()
    .length(2, "2-Letter code!")
    .transform((s) => s.toUpperCase()),
});

const guardianSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(120),
  email: z.email("Invalid Email Address"),
  phone: z.string().regex(phoneRegex, "Phone number must be in the format 416-416-4166 or 416 416 4166"),
  shortCode: z
    .string()
    .min(1)
    .max(32)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  address: addressSchema.optional(),
});

type FormInput = z.input<typeof guardianSchema>;
type FormOutput = z.output<typeof guardianSchema>;

export function GuardianCreateModal({
  onCreated,
  onCancel,
}: {
  onCreated: (guardian: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    shortCode?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormInput>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      shortCode: "",
      notes: "",
      address: {
        streetNumber: "",
        streetName: "",
        unit: "",
        city: "",
        province: "Ontario",
        postalCode: "",
        countryCode: "CA",
      },
    },
  });

  async function submit(values: FormInput) {
    setBusy(true);
    try {
      const g = await createGuardian(values);
      onCreated(g);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create guardian");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Full name</Label>
          <Input
            {...register("fullName")}
            placeholder="John Smith"
            disabled={busy}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Short code (optional)</Label>
          <Input
            {...register("shortCode")}
            placeholder="JSMITH1"
            disabled={busy}
          />
          {errors.shortCode && (
            <p className="text-xs text-red-600">{errors.shortCode.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            {...register("email")}
            placeholder="John.Smith@gmail.com"
            disabled={busy}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Phone Number</Label>
          <Input
            {...register("phone", {
              pattern: {
                value: /^\d{3}[-\s]\d{3}[-\s]\d{4}$/,
                message:
                  "Phone number must be in the format 416-416-4166 or 416 416 4166",
              },
            })}
            placeholder="416-666-6666"
            disabled={busy}
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="mb-2 text-sm font-medium">Billing Address</div>
        <div className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2 space-y-1">
                <Label>Street No.</Label>
                <Input {...register("address.streetNumber")} placeholder="123" disabled={busy} />
                {errors.address?.streetNumber && <p className="text-xs text-red-600">{errors.address.streetNumber.message}</p>}
            </div>
            <div className="sm:col-span-4 space-y-1">
                <Label>Street Name</Label>
                <Input {...register("address.streetName")} placeholder="Main St" disabled={busy} />
                {errors.address?.streetName && <p className="text-xs text-red-600">{errors.address.streetName.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
                <Label>Unit No. (Optional)</Label>
                <Input {...register("address.unit")} placeholder="123" disabled={busy} />
            </div>
            <div className="sm:col-span-2 space-y-1">
                <Label>Province</Label>
                <Input {...register("address.province")} placeholder="Ontario" disabled={busy} />
                {errors.address?.province && <p className="text-xs text-red-600">{errors.address.province.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
                <Label>City</Label>
                <Input {...register("address.city")} placeholder="Toronto" disabled={busy} />
                {errors.address?.city && <p className="text-xs text-red-600">{errors.address.city.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
                <Label>Postal Code</Label>
                <Input {...register("address.postalCode")} placeholder="A1A 1A1" disabled={busy} />
                {errors.address?.postalCode && <p className="text-xs text-red-600">{errors.address.postalCode.message}</p>}
            </div>
            <div className="sm:col-span-2 space-y-1">
                <Label>Country</Label>
                <Select 
                    defaultValue="CA"
                    onValueChange={(v: "CA" | "US") => setValue("address.countryCode", v as "CA" | "US", { shouldValidate: true })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                </Select>
                <input type="hidden" {...register("address.countryCode")} />
                {errors.address?.countryCode && <p className="text-xs text-red-600">{errors.address.countryCode.message}</p>}
            </div>
        </div>

        <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input {...register("notes")} placeholder="..." disabled={busy} />
            {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
        </div>

        <div className="mt-4 flex gap-2 justify-between">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Create guardian"}</Button>
        </div>
      </div>
    </form>
  );
}
