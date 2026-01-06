"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormSchema } from "@/lib/zod/term";
import type { FormInput, FormOutput } from "@/lib/zod/term";
import { createTerm } from "@/lib/api/term-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import QuickAdd from "./QuickAdd";
import OfferingList from "./OfferingList";
import { Button } from "@/components/ui/button";

export default function NewTermForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      slug: "",
      startDate: "",
      endDate: "",
      weeks: 8,
      templates: [],
    } satisfies FormInput,
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: "templates",
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (raw: FormInput) => {
        setSubmitting(true);
        try {
          const values: FormOutput = FormSchema.parse(raw);
          await createTerm(values);
          router.push(`/term`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Something went wrong";
          form.setError("root", {
            type: "server",
            message: msg,
          });
        } finally {
          setSubmitting(false);
        }
      })}
      className="space-y-6 rounded-md border bg-white p-5 dark:bg-slate-950"
    >
      {form.formState.errors.root?.message && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          {form.formState.errors.root.message}
        </p>
      )}
      {/* Term basics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Fall 2025" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" placeholder="fall-2025" {...form.register("slug")} />
        </div>

        <div>
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
          {form.formState.errors.startDate && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...form.register("endDate")} />
          {form.formState.errors.endDate && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.endDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="weeks">Weeks (classes per offering)</Label>
          <Input
            id="weeks"
            type="number"
            min={1}
            max={20}
            {...form.register("weeks", { valueAsNumber: true })}
          />
          {form.formState.errors.weeks && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.weeks.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || form.formState.isSubmitting}
        >
          {submitting || form.formState.isSubmitting
            ? "Creating…"
            : "Create term"}
        </Button>
      </div>

      <QuickAdd form={form} />
      <OfferingList form={form} fieldArray={fieldArray} />
    </form>
  );
}
