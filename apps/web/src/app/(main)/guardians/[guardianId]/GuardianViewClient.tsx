"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit2,
  Save,
  X,
  User,
  Phone,
  Mail,
  StickyNote,
  Trash2,
  DollarSign,
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

import { updateGuardian } from "@/lib/api/guardian-client";
import { deleteEnrollment } from "@/lib/api/schedule-client";
import { TransferEnrollmentDialog } from "@/components/schedule/TransferEnrollmentDialog";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";
import { z } from "zod";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { CurrentUser } from "@/lib/auth/user";
import Link from "next/link";
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

const EditGuardianSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  notes: z.string().optional(),
  shortCode: z.string().optional(),
  waiverSigned: z.boolean(),
});

type EditGuardianInput = z.infer<typeof EditGuardianSchema>;

// Types for the deep nested data we are now fetching
type AttendanceData = {
  id: string;
  classSessionId?: string; // These might not be selected directly if not in select list, checking service
  enrollmentId?: string;
  status: string;
  notes?: string | null;
  markedAt: string; // JSON date string
  classSession: {
    date: string; // JSON date string
  };
};

type OfferingData = {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  termId: string; // Added to service
  term: {
    id: string;
    name: string;
  };
  instructors: Array<{
    staffUser: {
      fullName: string;
    };
    instructor?: {
      firstName: string;
      lastName: string;
    };
  }>;
};

type EnrollmentData = {
  id: string;
  status: string;
  enrollDate: string;
  classRatio: string;
  offering: OfferingData;
  invoiceLineItem?: {
    invoice: {
      id: string;
      status: string;
      totalAmount: number;
      payments: Array<{
        amount: number;
      }>;
    };
  };
  attendance: AttendanceData[];
};

type GuardianData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shortCode?: string;
  notes?: string | null;
  waiverSigned: boolean;

  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    shortCode?: string | null;
    birthdate?: string | null;
    level?: string | null;
    enrollments: Array<EnrollmentData>;
  }>;
};

// Helper for Invoice Status Badge (copied/adapted from StudentViewClient)
function getInvoiceStatusBadge(enrollment: EnrollmentData) {
  if (!enrollment.invoiceLineItem) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" />
        Not Invoiced
      </Badge>
    );
  }

  const invoice = enrollment.invoiceLineItem.invoice;

  if (invoice.status === "paid") {
    return (
      <Badge variant="default" className="flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Paid
      </Badge>
    );
  }

  if (invoice.status === "partial") {
    const paid = invoice.payments.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0,
    );
    const balance = Number(invoice.totalAmount) - paid;
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <DollarSign className="w-3 h-3 shrink-0" />
        Partial (${balance.toFixed(2)} due)
      </Badge>
    );
  }

  if (invoice.status === "void") {
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3 shrink-0" />
        Void
      </Badge>
    );
  }
  return null;
}

export default function GuardianViewClient({
  guardian,
  user,
}: {
  guardian: GuardianData;
  user: CurrentUser;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Enrollment Actions State
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{
    id: string;
    offeringId: string;
    offering: OfferingData;
    attendedSessions: Array<{ id: string; date: string; status: string }>;
    studentId: string;
    studentName: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<EditGuardianInput>({
    resolver: zodResolver(EditGuardianSchema),
    defaultValues: {
      fullName: guardian.fullName,
      email: guardian.email,
      phone: guardian.phone,
      shortCode: guardian.shortCode ?? undefined,
      notes: guardian.notes || undefined,
      waiverSigned: guardian.waiverSigned ?? false,
    },
  });

  const handleSave = async (data: EditGuardianInput) => {
    try {
      setLoading(true);
      await updateGuardian(guardian.id, data);
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

  const calculateAge = (birthdate: string | null | undefined) => {
    if (!birthdate) return "Not provided";
    const birth = new Date(birthdate);
    const today = new Date();
    let years = today.getUTCFullYear() - birth.getUTCFullYear();
    let months = today.getUTCMonth() - birth.getUTCMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (today.getUTCDate() < birth.getUTCDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    return `${years} years, ${months} months`;
  };

  // Transfer Handlers
  const handleTransferClick = (
    enrollment: EnrollmentData,
    student: { id: string; firstName: string; lastName: string },
  ) => {
    // We need to shape the data for the TransferDialog
    // Ideally, we fetch attendance or just pass empty if checking isn't strict here
    // But strictly, TransferDialog expects attendedSessions.
    // Since backend service returns attendance now, we should pass it.
    // If not fetched, we might pass empty array, but be careful.
    // For this iteration, let's assume empty for simplicity or use what's passed if we expanded the service (we did expand it but `attendance` in type above is `any[]`).

    setSelectedEnrollment({
      id: enrollment.id,
      offeringId: enrollment.offering.id,
      offering: enrollment.offering,
      attendedSessions:
        enrollment.attendance?.map((a) => ({
          id: a.id,
          date: a.classSession.date,
          status: a.status,
        })) || [],
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
    });
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    setTransferDialogOpen(false);
    setSelectedEnrollment(null);
    router.refresh();
  };

  const handleDeleteClick = (enrollmentId: string) => {
    setEnrollmentToDelete(enrollmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!enrollmentToDelete) return;
    try {
      setLoading(true);
      await deleteEnrollment(enrollmentToDelete);
      setDeleteDialogOpen(false);
      setEnrollmentToDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete enrollment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete enrollment",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => router.back()} // Or router.push("/guardians") if we had a list page
          className="hover:text-blue-600 underline"
        >
          Back
        </button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Guardian Profile</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Guardian Info & Notes */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Guardian Details
              </CardTitle>
              {!isEditing ? (
                <PermissionGate
                  allowedRoles={["super_admin", "admin", "manager"]}
                  currentRole={user.role}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </PermissionGate>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      reset();
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
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input {...register("phone")} disabled={loading} />
                    {errors.phone && (
                      <p className="text-xs text-red-500">
                        {errors.phone.message}
                      </p>
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

                  {/* Address Fields Simplified for brevity, typically would be a sub-form */}
                  {/* Ensuring we preserve existing address if not modifying drastically, but here let's just allow Notes edit primarily as requested? 
                       User asked: "make notes editable for admin and managers".
                       We already have address editing in global edit. Let's just include Notes prominently.
                   */}

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
        </div>

        {/* Right Column: Students & Enrollments */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Students ({guardian.students.length})
          </h2>

          {guardian.students.map((student) => {
            const activeEnrollments = student.enrollments.filter(
              (e) => e.status === "active",
            );
            const otherEnrollments = student.enrollments.filter(
              (e) => e.status !== "active",
            );

            return (
              <Card
                key={student.id}
                className="overflow-hidden border-t-4 border-t-blue-500 shadow-sm"
              >
                <CardHeader className="bg-gray-50 pb-3 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/students/${student.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {student.firstName} {student.lastName}
                        </Link>
                      </CardTitle>
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-gray-500 text-xs uppercase">
                            Age:
                          </span>{" "}
                          {calculateAge(student.birthdate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-gray-500 text-xs uppercase">
                            Level:
                          </span>{" "}
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {student.level || "N/A"}
                          </Badge>
                        </span>
                      </div>
                    </div>
                    <Link href={`/students/${student.id}`}>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Active Enrollments */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
                      Active Enrollments
                    </h3>
                    {activeEnrollments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        No active enrollments.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeEnrollments.map((enrollment) => {
                          const instructors =
                            enrollment.offering.instructors || [];
                          const instructorNames = instructors
                            .map((i) =>
                              i.instructor
                                ? `${i.instructor.firstName} ${i.instructor.lastName}`
                                : (i.staffUser?.fullName ?? "Unknown"),
                            )
                            .join(", ");
                          const invoiceBadge =
                            getInvoiceStatusBadge(enrollment);

                          return (
                            <div
                              key={enrollment.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-green-50/50 hover:bg-green-50 transition-colors"
                            >
                              <div className="space-y-1 mb-2 sm:mb-0">
                                <div className="font-semibold text-green-900">
                                  {enrollment.offering.title}{" "}
                                  <span className="text-green-700 font-normal text-sm">
                                    ({enrollment.offering.term.name})
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 flex flex-wrap gap-x-4">
                                  <span>
                                    {
                                      FULL_DAY_LABELS[
                                        enrollment.offering.weekday
                                      ]
                                    }{" "}
                                    {enrollment.offering.startTime} -{" "}
                                    {enrollment.offering.endTime}
                                  </span>
                                  {instructorNames && (
                                    <span className="text-gray-500">
                                      w/ {instructorNames}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {invoiceBadge}
                                  <span className="text-xs text-gray-400">
                                    Ratio: {enrollment.classRatio}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <PermissionGate
                                  allowedRoles={[
                                    "super_admin",
                                    "admin",
                                    "manager",
                                  ]}
                                  currentRole={user.role}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 bg-white"
                                    onClick={() =>
                                      handleTransferClick(enrollment, student)
                                    }
                                  >
                                    Transfer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      handleDeleteClick(enrollment.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Past/Other Enrollments (Collapsed or simple list) */}
                  {otherEnrollments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Recent Inactive Enrollments
                      </h3>
                      <div className="grid gap-2">
                        {otherEnrollments.slice(0, 3).map((enrollment) => {
                          const instructors =
                            enrollment.offering.instructors || [];
                          const instructorNames = instructors
                            .map((i) =>
                              i.instructor
                                ? `${i.instructor.firstName} ${i.instructor.lastName}`
                                : (i.staffUser?.fullName ?? "Unknown"),
                            )
                            .join(", ");

                          return (
                            <div
                              key={enrollment.id}
                              className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border border-gray-100 opacity-70"
                            >
                              <div className="flex flex-col">
                                <div>
                                  <span className="font-medium">
                                    {enrollment.offering.title}
                                  </span>
                                  <span className="text-gray-500 mx-1">•</span>
                                  <span className="text-gray-500">
                                    {enrollment.offering.term.name}
                                  </span>
                                </div>
                                {instructorNames && (
                                  <div className="text-xs text-gray-500">
                                    Instructor: {instructorNames}
                                  </div>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs uppercase scale-90"
                              >
                                {enrollment.status}
                              </Badge>
                            </div>
                          );
                        })}
                        {otherEnrollments.length > 3 && (
                          <p className="text-xs text-center text-gray-400 mt-1">
                            +{otherEnrollments.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {guardian.students.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">
                No students found for this guardian.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedEnrollment && (
        <TransferEnrollmentDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          enrollment={selectedEnrollment}
          attendedSessions={selectedEnrollment.attendedSessions}
          onSuccess={handleTransferSuccess}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              enrollment and remove the student from the class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
