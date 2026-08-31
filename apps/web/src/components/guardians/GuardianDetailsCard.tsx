"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Edit2,
  Save,
  X,
  User,
  Phone,
  Mail,
  StickyNote,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { StaffRole } from "@/lib/auth/permissions";
import { EmailGuardianDialog } from "./EmailGuardianDialog";
import { updateGuardian } from "@/lib/api/client/guardian";
import type { GuardianData } from "./guardian-view.types";

const EditGuardianSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  notes: z.string().optional(),
  shortCode: z.string().optional(),
  waiverSigned: z.boolean(),
});

type EditGuardianInput = z.infer<typeof EditGuardianSchema>;

interface GuardianDetailsCardProps {
  guardian: GuardianData;
  userRole: StaffRole;
}

export function GuardianDetailsCard({
  guardian,
  userRole,
}: GuardianDetailsCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditGuardianInput>({
    resolver: zodResolver(EditGuardianSchema),
    defaultValues: {
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone,
      notes: guardian.notes || "",
      shortCode: guardian.shortCode || "",
      waiverSigned: guardian.waiverSigned,
    },
  });

  const handleSave = async (data: EditGuardianInput) => {
    try {
      setLoading(true);
      await updateGuardian(guardian.id, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        notes: data.notes || undefined,
        shortCode: data.shortCode || undefined,
        waiverSigned: data.waiverSigned,
      });
      setIsEditing(false);
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Guardian Details
          </CardTitle>
          {!isEditing ? (
            <PermissionGate
              allowedRoles={["super_admin", "admin", "manager"]}
              currentRole={userRole}
            >
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </PermissionGate>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  reset({
                    fullName: guardian.fullName,
                    email: guardian.email,
                    phone: guardian.phone,
                    notes: guardian.notes || "",
                    shortCode: guardian.shortCode || "",
                    waiverSigned: guardian.waiverSigned,
                  });
                  setIsEditing(false);
                }}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSubmit(handleSave)}
                disabled={loading}
              >
                <Save className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Full Name
                </Label>
                <p className="text-base font-medium text-gray-900">
                  {guardian.fullName}
                </p>
                {guardian.shortCode && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {guardian.shortCode}
                  </Badge>
                )}
                {guardian.waiverSigned ? (
                  <Badge
                    variant="default"
                    className="mt-1 ml-2 text-xs bg-green-100 text-green-800 hover:bg-green-100 border-none"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Waiver Signed
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="mt-1 ml-2 text-xs text-gray-500 border-gray-300"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" /> Waiver Pending
                  </Badge>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </Label>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${guardian.email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {guardian.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${guardian.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {guardian.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <StickyNote className="h-3 w-3" /> Notes
                </Label>
                <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-100 text-sm text-gray-800 italic min-h-[60px]">
                  {guardian.notes || "No notes available."}
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-3">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input {...register("fullName")} disabled={loading} />
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input {...register("email")} disabled={loading} />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input {...register("phone")} disabled={loading} />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Short Code</Label>
                <Input
                  {...register("shortCode")}
                  disabled={loading}
                  placeholder="(Optional)"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <Controller
                  control={control}
                  name="waiverSigned"
                  render={({ field }) => (
                    <Checkbox
                      id="waiverSigned"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="waiverSigned">Waiver Signed</Label>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  {...register("notes")}
                  disabled={loading}
                  className="min-h-[100px]"
                />
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <EmailGuardianDialog
        guardianName={guardian.fullName}
        guardianEmail={guardian.email}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </>
  );
}
