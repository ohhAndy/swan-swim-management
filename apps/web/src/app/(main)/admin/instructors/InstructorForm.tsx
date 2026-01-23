"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createInstructor,
  updateInstructor,
  type Instructor,
} from "@/lib/api/instructors";
import { Loader2, Plus, Trash } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
  certificates: z
    .array(
      z.object({
        name: z.string().min(1, "Certificate name is required"),
        expirationDate: z.string().optional(),
      }),
    )
    .optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InstructorFormProps {
  instructor?: Instructor;
}

export default function InstructorForm({ instructor }: InstructorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  interface Certificate {
    name: string;
    expirationDate?: string;
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: instructor?.firstName || "",
      lastName: instructor?.lastName || "",
      email: instructor?.email || "",
      phone: instructor?.phone || "",
      gender: instructor?.gender || "",
      startDate: instructor?.startDate
        ? new Date(instructor.startDate).toISOString().split("T")[0]
        : "",
      notes: instructor?.notes || "",
      isActive: instructor?.isActive ?? true,
      certificates: instructor?.certificates
        ? (instructor.certificates as unknown as Certificate[]).map((c) => ({
            name: c.name || "",
            expirationDate: c.expirationDate || "",
          }))
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "certificates",
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    // Transform certificates to simpler format if needed, but saving as objects {name: "..."} is fine for Json type.
    // Or we could map to strings: values.certificates?.map(c => c.name)
    // Let's stick to the object structure from the form which provides more flexibility for future fields (like date, expiry).

    try {
      if (instructor) {
        await updateInstructor(instructor.id, values);
        toast.success("Instructor updated successfully");
      } else {
        await createInstructor(values);
        toast.success("Instructor created successfully");
      }
      router.push("/admin/instructors");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="416-666-6666"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gender</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes..."
            {...register("notes")}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Certificates</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", expirationDate: "" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Certificate
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Certificate Name"
                  {...register(`certificates.${index}.name`)}
                />
                {errors.certificates?.[index]?.name && (
                  <p className="text-sm text-red-500">
                    {errors.certificates[index]?.name?.message}
                  </p>
                )}
              </div>
              <div className="w-[180px] space-y-1">
                <Input
                  type="date"
                  placeholder="Expiration Date"
                  {...register(`certificates.${index}.expirationDate`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5"
                onClick={() => remove(index)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {errors.certificates && (
            <p className="text-sm text-red-500">
              {errors.certificates.message}
            </p>
          )}
        </div>

        <div className="flex flex-row items-center space-x-3 rounded-md border p-4">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Checkbox
                id="isActive"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="isActive">Active Instructor</Label>
            <p className="text-sm text-muted-foreground">
              Inactive instructors cannot be assigned to new classes.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {instructor ? "Update Instructor" : "Create Instructor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
