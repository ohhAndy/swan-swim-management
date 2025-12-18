"use client";

import type { UseFormReturn } from "react-hook-form";
import type { FormInput } from "@/lib/zod/term";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DAY_LABELS } from "@/lib/schedule/slots";

export default function OfferingRow({
  form,
  index,
  remove,
}: {
  form: UseFormReturn<FormInput>;
  index: number;
  remove: () => void;
}) {
  const err = form.formState.errors.templates?.[index];

  return (
    <div className="grid grid-cols-1 gap-2 rounded border bg-slate-50 p-3 sm:grid-cols-6">
        <div className="sm:col-span-2">
        <Label>Title</Label>
        <Input placeholder="Beginner 1 - Lane A" {...form.register(`templates.${index}.title`)} />
        {err?.title && <p className="mt-1 text-xs text-red-600">{String(err.title.message)}</p>}
      </div>

      <div>
        <Label>Weekday</Label>
        <Select
          onValueChange={(v) => form.setValue(`templates.${index}.weekday`, Number(v), { shouldValidate: true })}
          defaultValue={String(form.getValues(`templates.${index}.weekday`) ?? 1)}
        >
          <SelectTrigger><SelectValue placeholder="Pick a day" /></SelectTrigger>
          <SelectContent>
            {DAY_LABELS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {err?.weekday && <p className="mt-1 text-xs text-red-600">{String(err.weekday.message)}</p>}
      </div>

      <div>
        <Label>Start time</Label>
        <Input placeholder="09:30" {...form.register(`templates.${index}.startTime`)} />
        {err?.startTime && <p className="mt-1 text-xs text-red-600">{String(err.startTime.message)}</p>}
      </div>

      <div>
        <Label>Duration (min)</Label>
        <Input type="number" min={15} max={240} {...form.register(`templates.${index}.duration`, { valueAsNumber: true })} />
        {err?.duration && <p className="mt-1 text-xs text-red-600">{String(err.duration.message)}</p>}
      </div>
      <div>
        <Label>Capacity</Label>
        <Input type="number" min={1} max={50} {...form.register(`templates.${index}.capacity`, { valueAsNumber: true })} />
        {err?.capacity && <p className="mt-1 text-xs text-red-600">{String(err.capacity.message)}</p>}
      </div>

      <div className="sm:col-span-6">
        <Label>Notes (optional)</Label>
        <Textarea rows={2} placeholder="Lane, instructor, etc." {...form.register(`templates.${index}.notes`)} />
      </div>

      <div className="sm:col-span-6 flex justify-end">
        <Button type="button" variant="destructive" onClick={remove} aria-label="Remove Offering">Remove</Button>
      </div>
    </div>
  );
}