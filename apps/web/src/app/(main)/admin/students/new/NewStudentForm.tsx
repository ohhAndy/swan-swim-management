"use client";

import { createStudent } from "@/lib/api/students-client";
import { CreateStudentInput, CreateStudentSchema } from "@/lib/zod/student";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GuardianPicker } from "@/components/guardians/GuardianPicker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PRESCHOOL_LEVELS,
  SWIMMER_LEVELS,
  SWIMTEAM_LEVELS,
  PARENT_TOT_LEVELS,
} from "@/lib/constants/levels";

export default function NewStudentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: {
      guardianId: "",
      shortCode: "",
      firstName: searchParams.get("firstName") || "",
      lastName: searchParams.get("lastName") || "",
      level: "",
      birthdate: "2000-01-01",
    },
  });

  const guardianId = watch("guardianId");
  const level = watch("level");

  async function onSubmit(values: CreateStudentInput) {
    try {
      setSubmitting(true);
      await createStudent(values);
      reset();
      router.push("/students");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Create student failed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleLevelSelect = (selectedLevel: string) => {
    setValue("level", selectedLevel, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Guardian</Label>
        <GuardianPicker
          value={guardianId || null}
          onChange={(g) =>
            setValue("guardianId", g?.id ?? "", { shouldValidate: true })
          }
          disabled={submitting}
        />
        {errors.guardianId && (
          <p className="text-xs text-red-600">{errors.guardianId.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>First name</Label>
          <Input
            {...register("firstName")}
            placeholder="John"
            disabled={submitting}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Last name</Label>
          <Input
            {...register("lastName")}
            placeholder="Smith"
            disabled={submitting}
          />
          {errors.lastName && (
            <p className="text-xs text-red-600">{errors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Short Code (Optional)</Label>
          <Input
            {...register("shortCode")}
            placeholder="JSMITH1"
            disabled={submitting}
          />
          {errors.shortCode && (
            <p className="text-xs text-red-600">{errors.shortCode.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Level (Optional)</Label>
          <Select
            value={level}
            onValueChange={handleLevelSelect}
            disabled={submitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select swimming level" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              <SelectGroup>
                <SelectLabel className="font-light text-gray-500 text-xs">
                  Parent and Tot
                </SelectLabel>
                {PARENT_TOT_LEVELS.map((levelOption) => (
                  <SelectItem key={levelOption} value={levelOption}>
                    {levelOption}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="font-light text-gray-500 text-xs">
                  Preschool
                </SelectLabel>
                {PRESCHOOL_LEVELS.map((levelOption) => (
                  <SelectItem key={levelOption} value={levelOption}>
                    {levelOption}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="font-light text-gray-500 text-xs">
                  Swimmer
                </SelectLabel>
                {SWIMMER_LEVELS.map((levelOption) => (
                  <SelectItem key={levelOption} value={levelOption}>
                    {levelOption}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="font-light text-gray-500 text-xs">
                  Swim Team
                </SelectLabel>
                {SWIMTEAM_LEVELS.map((levelOption) => (
                  <SelectItem key={levelOption} value={levelOption}>
                    {levelOption}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.level && (
            <p className="text-xs text-red-600">{errors.level.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Birth Date</Label>
          <Input
            type="date"
            {...register("birthdate")}
            placeholder="2000-01-01"
            disabled={submitting}
          />
          {errors.birthdate && (
            <p className="text-xs text-red-600">{errors.birthdate.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || !guardianId}>
          {submitting ? "Saving..." : "Create student"}
        </Button>
      </div>
    </form>
  );
}
