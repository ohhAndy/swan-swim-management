"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormSchema } from "@/lib/zod/term";
import type { FormInput, FormOutput } from "@/lib/zod/term";
import { createTerm } from "@/lib/api/client/term";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import QuickAdd from "./QuickAdd";
import OfferingList from "./OfferingList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_SWIM_TEAM_MEET_FEES } from "@school/shared-types";

const TERM_TYPES = [
  {
    value: "regular",
    label: "Lesson term",
    hint: "Weekly lessons billed per class",
  },
  {
    value: "swim_team_season",
    label: "Swim team season",
    hint: "Year-long practices billed by weekly frequency",
  },
] as const;

const DEFAULT_FEE_TIERS = ([1, 2, 3, 4] as const).map((frequency) => ({
  frequency,
  practiceFee: 0,
  meetFee: DEFAULT_SWIM_TEAM_MEET_FEES[frequency],
}));

export default function NewTermForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: "regular",
      feeTiers: DEFAULT_FEE_TIERS,
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

  const termType = form.watch("type") ?? "regular";
  const isSeason = termType === "swim_team_season";

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
      {/* Term type */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TERM_TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={termType === option.value}
            onClick={() =>
              form.setValue("type", option.value, { shouldValidate: true })
            }
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              termType === option.value
                ? option.value === "swim_team_season"
                  ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                  : "border-[#1c82c5] bg-blue-50 dark:bg-blue-950/30"
                : "hover:bg-muted/50",
            )}
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-xs text-muted-foreground">{option.hint}</div>
          </button>
        ))}
      </div>

      {/* Term basics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder={isSeason ? "Swim Team 2026-27" : "Fall 2025"}
            {...form.register("name")}
          />
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

        <div className={isSeason ? "hidden" : undefined}>
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

      {isSeason && (
        <div className="space-y-3 rounded-md border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <div>
            <h3 className="font-semibold">Season fees</h3>
            <p className="text-xs text-muted-foreground">
              The practice fee is the set price for the whole season at each
              weekly frequency. The meet fee is only charged to swimmers who
              compete. Both can be changed later.
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Per week
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Practice fee ($ / season)
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Meet fee ($ / year)
            </span>
            {DEFAULT_FEE_TIERS.map((tier, index) => (
              <div key={tier.frequency} className="contents">
                <span className="font-medium">{tier.frequency}x</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label={`Practice fee for ${tier.frequency}x per week`}
                  {...form.register(`feeTiers.${index}.practiceFee`, {
                    valueAsNumber: true,
                  })}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label={`Meet fee for ${tier.frequency}x per week`}
                  {...form.register(`feeTiers.${index}.meetFee`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Practices run every week until the end date. You can add them
            below or later from the season schedule.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || form.formState.isSubmitting}
        >
          {submitting || form.formState.isSubmitting
            ? "Creating…"
            : isSeason
              ? "Create season"
              : "Create term"}
        </Button>
      </div>

      <QuickAdd form={form} />
      <OfferingList form={form} fieldArray={fieldArray} />
    </form>
  );
}
