"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2, Save, X, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { EmailGuardianDialog } from "@/components/guardians/EmailGuardianDialog";
import { updateGuardian } from "@/lib/api/client/guardian";
import { StaffRole } from "@/lib/auth/permissions";
import type { Student } from "@/lib/types/models";

const EditGuardianSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
});

type EditGuardianInput = z.infer<typeof EditGuardianSchema>;

interface StudentGuardianCardProps {
  guardian: Student["guardian"];
  userRole: StaffRole;
}

export function StudentGuardianCard({
  guardian,
  userRole,
}: StudentGuardianCardProps) {
  const router = useRouter();
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditGuardianInput>({
    resolver: zodResolver(EditGuardianSchema),
    defaultValues: {
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone,
    },
  });

  const handleSaveGuardian = async (data: EditGuardianInput) => {
    try {
      setLoading(true);
      await updateGuardian(guardian.id, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      setIsEditingGuardian(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update guardian:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update guardian",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGuardian = () => {
    reset({
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone,
    });
    setIsEditingGuardian(false);
  };

  return (
    <PermissionGate
      allowedRoles={["super_admin", "admin", "manager"]}
      currentRole={userRole}
    >
      <div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Guardian
            </CardTitle>
            {!isEditingGuardian ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingGuardian(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelGuardian}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit(handleSaveGuardian)}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEditingGuardian ? (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Name
                  </Label>
                  <p className="text-lg">
                    <Link
                      href={`/guardians/${guardian.id}`}
                      className="hover:underline text-blue-600"
                    >
                      {guardian.fullName}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Email
                  </Label>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                    <a
                      href={`mailto:${guardian.email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {guardian.email}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 text-gray-400 hover:text-blue-600"
                      onClick={() => setEmailDialogOpen(true)}
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Phone
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a
                      href={`tel:${guardian.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {guardian.phone}
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <form className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input {...register("fullName")} disabled={loading} />
                  {errors.fullName && (
                    <p className="text-xs text-red-600">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input {...register("email")} disabled={loading} />
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input {...register("phone")} disabled={loading} />
                  {errors.phone && (
                    <p className="text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <EmailGuardianDialog
        guardianName={guardian.fullName}
        guardianEmail={guardian.email}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </PermissionGate>
  );
}
