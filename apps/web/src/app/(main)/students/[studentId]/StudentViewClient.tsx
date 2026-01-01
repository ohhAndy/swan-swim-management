"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit2,
  Save,
  X,
  User,
  Calendar,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { updateStudent } from "@/lib/api/students-client";
import { deleteEnrollment } from "@/lib/api/schedule-client";
import { updateGuardian } from "@/lib/api/guardian-client";

import { TransferEnrollmentDialog } from "@/components/schedule/TransferEnrollmentDialog";

import {
  PRESCHOOL_LEVELS,
  SWIMMER_LEVELS,
  SWIMTEAM_LEVELS,
} from "@/lib/constants/levels";

import { Enrollment, Student } from "@/lib/constants/student";
import { FULL_DAY_LABELS } from "@/lib/schedule/slots";
import { z } from "zod";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { CurrentUser } from "@/lib/auth/user";
import { DollarSign, AlertCircle, CheckCircle } from "lucide-react";

const EditStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shortCode: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
});

type EditStudentInput = z.infer<typeof EditStudentSchema>;

const EditGuardianSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
});

type EditGuardianInput = z.infer<typeof EditGuardianSchema>;

function getInvoiceStatusBadge(enrollment: Enrollment) {
  if (!enrollment.invoiceLineItem) {
    // Not invoiced yet
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Not Invoiced
      </Badge>
    );
  }

  // Has invoice - check payment status
  const invoice = enrollment.invoiceLineItem.invoice;

  if (!invoice) {
    return null;
  }

  if (invoice.status === "paid") {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Paid
      </Badge>
    );
  }

  if (invoice.status === "partial") {
    const paid = invoice.payments.reduce((acc, payment) => {
      return acc + payment.amount;
    }, 0);
    const balance = invoice.totalAmount - paid;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <DollarSign className="w-3 h-3 shrink-0" />
        Partial (${balance.toFixed(2)} due)
      </Badge>
    );
  }

  if (invoice.status === "void") {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        Void
      </Badge>
    );
  }
  return null;
}

export default function StudentViewClient({
  student,
  user,
}: {
  student: Student;
  user: CurrentUser;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);
  const [loading, setLoading] = useState(false);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{
    id: string;
    offeringId: string;
    offering: {
      id: string;
      title: string;
      weekday: number;
      startTime: string;
      endTime: string;
      termId: string;
      term: {
        id: string;
        name: string;
      };
    };
    attendedSessions: Array<{
      id: string;
      date: string;
      status: string;
    }>;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EditStudentInput>({
    resolver: zodResolver(EditStudentSchema),
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      shortCode: student.shortCode || "",
      level: student.level || "",
      birthdate: student.birthdate ? student.birthdate.split("T")[0] : "",
    },
  });

  const {
    register: registerGuardian,
    handleSubmit: handleSubmitGuardian,
    formState: { errors: errorsGuardian },
    reset: resetGuardian,
  } = useForm<EditGuardianInput>({
    resolver: zodResolver(EditGuardianSchema),
    defaultValues: {
      fullName: student.guardian.fullName,
      email: student.guardian.email,
      phone: student.guardian.phone,
    },
  });

  const level = watch("level");
  const displayLevel = level || "none";

  // Calculate age
  const calculateAge = (birthdate: string | null) => {
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset();
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
        birthdate: data.birthdate || null,
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update student:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update student"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGuardian = async (data: EditGuardianInput) => {
    try {
      setLoading(true);
      await updateGuardian(student.guardian.id, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      setIsEditingGuardian(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update guardian:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update guardian"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGuardian = () => {
    resetGuardian();
    setIsEditingGuardian(false);
  };

  const handleLevelSelect = (selectedLevel: string) => {
    const levelValue = selectedLevel === "none" ? "" : selectedLevel;
    setValue("level", levelValue, { shouldValidate: true });
  };

  // Separate current and past enrollments
  const currentEnrollments = student.enrollments.filter(
    (e) => e.status === "active"
  );
  const pastEnrollments = student.enrollments.filter(
    (e) => e.status !== "active"
  );

  const handleTransferClick = (enrollment: (typeof student.enrollments)[0]) => {
    setSelectedEnrollment({
      id: enrollment.id,
      offeringId: enrollment.offeringId,
      offering: enrollment.offering,
      attendedSessions:
        enrollment.attendance.map((att) => ({
          id: att.classSession.id,
          date: att.classSession.date,
          status: att.status,
        })) ?? [],
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
        error instanceof Error ? error.message : "Failed to delete enrollment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => router.push("/students")}
          className="hover:text-blue-600 underline"
        >
          Students
        </button>
        <span>/</span>
        <span className="text-gray-900">
          {student.firstName} {student.lastName}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Information Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
              {!isEditing ? (
                <PermissionGate
                  allowedRoles={["admin", "manager"]}
                  currentRole={user.role}
                >
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
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
                // View Mode
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
                        ? new Date(student.birthdate).toLocaleDateString(
                            "en-CA",
                            { timeZone: "UTC" }
                          )
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
                // Edit Mode
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
                      value={displayLevel}
                      onValueChange={handleLevelSelect}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
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
        </div>

        {/* Guardian Information Card */}
        <PermissionGate
          allowedRoles={["admin", "manager"]}
          currentRole={user.role}
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
                      onClick={handleSubmitGuardian(handleSaveGuardian)}
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
                      <p className="text-lg">{student.guardian.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Email
                      </Label>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                        <a
                          href={`mailto:${student.guardian.email}`}
                          className="text-blue-600 hover:underline break-all"
                        >
                          {student.guardian.email}
                        </a>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Phone
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a
                          href={`tel:${student.guardian.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {student.guardian.phone}
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <form className="space-y-4">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input
                        {...registerGuardian("fullName")}
                        disabled={loading}
                      />
                      {errorsGuardian.fullName && (
                        <p className="text-xs text-red-600">
                          {errorsGuardian.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        {...registerGuardian("email")}
                        disabled={loading}
                      />
                      {errorsGuardian.email && (
                        <p className="text-xs text-red-600">
                          {errorsGuardian.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        {...registerGuardian("phone")}
                        disabled={loading}
                      />
                      {errorsGuardian.phone && (
                        <p className="text-xs text-red-600">
                          {errorsGuardian.phone.message}
                        </p>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGate>
      </div>

      {/* Basic Enrollments Section - We'll enhance this later */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Enrollment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current Enrollments */}
            {currentEnrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-700 mb-3">
                  Current Enrollments
                </h3>
                <div className="space-y-2">
                  {currentEnrollments.map((enrollment) => {
                    const instructors = enrollment.offering.instructors || [];
                    const instructorNames = instructors
                      .map((i) => i.staffUser.fullName)
                      .join(", ");

                    const badge = getInvoiceStatusBadge(enrollment);

                    return (
                      <div
                        key={enrollment.id}
                        className="p-4 border rounded-lg bg-green-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {enrollment.offering.title}
                            </h4>
                            <p className="text-sm font-medium">
                              {enrollment.offering.term.name}
                            </p>

                            <p className="text-sm text-gray-600 pt-2">
                              {FULL_DAY_LABELS[enrollment.offering.weekday]}{" "}
                              {enrollment.offering.startTime}-
                              {enrollment.offering.endTime} (
                              {enrollment.classRatio})
                            </p>
                            {instructors.length > 0 ? (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Instructor:</span>{" "}
                                {instructorNames}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 italic mt-1">
                                No instructor assigned
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Enrolled:{" "}
                              {new Date(
                                enrollment.enrollDate
                              ).toLocaleDateString("en-CA")}
                            </p>
                          </div>
                          <div className="flex flex-col justify-between h-30">
                            {badge}

                            <PermissionGate
                              allowedRoles={["admin", "manager"]}
                              currentRole={user.role}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTransferClick(enrollment)}
                                className="bg-yellow-100 text-black mb-2"
                              >
                                Transfer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(enrollment.id)}
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </PermissionGate>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Enrollments */}
            {pastEnrollments.map((enrollment) => {
              const instructors = enrollment.offering.instructors || [];
              const instructorNames = instructors
                .map((i) => i.staffUser.fullName)
                .join(", ");

              return (
                <div
                  key={enrollment.id}
                  className="p-4 border rounded-lg bg-gray-50 opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {enrollment.offering.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {FULL_DAY_LABELS[enrollment.offering.weekday]}{" "}
                        {enrollment.offering.startTime}-
                        {enrollment.offering.endTime} ({enrollment.classRatio})
                      </p>
                      {/* ADD INSTRUCTOR DISPLAY HERE TOO */}
                      {instructors.length > 0 ? (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Instructor:</span>{" "}
                          {instructorNames}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic mt-1">
                          No instructor assigned
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Enrolled:{" "}
                        {new Date(enrollment.enrollDate).toLocaleDateString(
                          "en-CA"
                        )}
                      </p>
                    </div>
                    {getInvoiceStatusBadge(enrollment)}
                  </div>
                </div>
              );
            })}
            {student.enrollments.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No enrollment history found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Dialog */}
      {selectedEnrollment && (
        <TransferEnrollmentDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          enrollment={{
            id: selectedEnrollment.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            offeringId: selectedEnrollment.offeringId,
            offering: selectedEnrollment.offering,
          }}
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
              enrollment record.
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
