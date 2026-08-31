"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2, Save, X, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { StaffRole } from "@/lib/auth/permissions";
import { updateStudent, deleteStudent } from "@/lib/api/client/students";
import { getLevels, Level } from "@/lib/api/client/curriculum";
import { calculateAge } from "./student-view.utils";
import type { Student } from "@/lib/types/models";

const EditStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shortCode: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  levelId: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
});

type EditStudentInput = z.infer<typeof EditStudentSchema>;

interface StudentInfoCardProps {
  student: Student;
  userRole: StaffRole;
}

export function StudentInfoCard({ student, userRole }: StudentInfoCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [deleteStudentDialogOpen, setDeleteStudentDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditStudentInput>({
    resolver: zodResolver(EditStudentSchema),
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      shortCode: student.shortCode || "",
      level: student.level || "",
      levelId: student.levelId || "",
      birthdate: student.birthdate
        ? new Date(student.birthdate).toISOString().split("T")[0]
        : "",
    },
  });

  useEffect(() => {
    getLevels().then(setLevels).catch(console.error);
  }, []);

  const levelId = watch("levelId");
  const displayLevelId = levelId || "none";

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      shortCode: student.shortCode || "",
      level: student.level || "",
      levelId: student.levelId || "",
      birthdate: student.birthdate
        ? new Date(student.birthdate).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(false);
  };

  const handleSave = async (data: EditStudentInput) => {
    try {
      setLoading(true);
      await updateStudent(student.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        shortCode: data.shortCode || null,
        level: data.level || null,
        levelId: data.levelId || null,
        birthdate: data.birthdate || null,
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update student:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update student",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (selectedLevelId: string) => {
    if (selectedLevelId === "none") {
      setValue("level", "", { shouldValidate: true });
      setValue("levelId", "", { shouldValidate: true });
      return;
    }
    const selectedLevel = levels.find((l) => l.id === selectedLevelId);
    if (selectedLevel) {
      setValue("level", selectedLevel.name, { shouldValidate: true });
      setValue("levelId", selectedLevel.id, { shouldValidate: true });
    }
  };

  const groupedLevels = levels.reduce((acc, level) => {
    const category = level.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(level);
    return acc;
  }, {} as Record<string, Level[]>);

  const handleDeleteStudentConfirm = async () => {
    try {
      setLoading(true);
      await deleteStudent(student.id);
      setDeleteStudentDialogOpen(false);
      router.push(`/guardians/${student.guardian.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete student",
      );
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
          {!isEditing ? (
            <PermissionGate
              allowedRoles={["super_admin", "admin", "manager"]}
              currentRole={userRole}
            >
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteStudentDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </PermissionGate>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit(handleSave)}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  First Name
                </Label>
                <p className="text-lg">{student.firstName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Last Name
                </Label>
                <p className="text-lg">{student.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Short Code
                </Label>
                <p className="text-lg">{student.shortCode || "—"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Level
                </Label>
                <p className="text-lg">{student.level || "—"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Birth Date
                </Label>
                <p className="text-lg">
                  {student.birthdate
                    ? new Date(student.birthdate).toLocaleDateString("en-CA", {
                        timeZone: "UTC",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Age
                </Label>
                <p className="text-lg">{calculateAge(student.birthdate)}</p>
              </div>
            </div>
          ) : (
            <form className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input {...register("firstName")} disabled={loading} />
                {errors.firstName && (
                  <p className="text-xs text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input {...register("lastName")} disabled={loading} />
                {errors.lastName && (
                  <p className="text-xs text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Short Code</Label>
                <Input {...register("shortCode")} disabled={loading} />
                {errors.shortCode && (
                  <p className="text-xs text-red-600">
                    {errors.shortCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Select
                  value={displayLevelId}
                  onValueChange={handleLevelSelect}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(groupedLevels).map(([category, catLevels]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="font-light text-gray-500 text-xs">
                          {category}
                        </SelectLabel>
                        {catLevels.map((levelOption) => (
                          <SelectItem
                            key={levelOption.id}
                            value={levelOption.id}
                          >
                            {levelOption.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-red-600">
                    {errors.level.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Birth Date</Label>
                <Input
                  type="date"
                  {...register("birthdate")}
                  disabled={loading}
                  max={new Date().toISOString().split("T")[0]}
                  min="1900-01-01"
                />
                {errors.birthdate && (
                  <p className="text-xs text-red-600">
                    {errors.birthdate.message}
                  </p>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteStudentDialogOpen}
        onOpenChange={setDeleteStudentDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {student.firstName} {student.lastName}
              </span>{" "}
              and all their enrollment history will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudentConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
