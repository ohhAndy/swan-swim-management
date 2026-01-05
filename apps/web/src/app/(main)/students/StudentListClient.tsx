"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Users, Calendar, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchStudents } from "@/lib/api/students-client";

import {
  PRESCHOOL_LEVELS,
  SWIMMER_LEVELS,
  SWIMTEAM_LEVELS,
} from "@/lib/constants/levels";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { CurrentUser } from "@/lib/auth/user";

// Types based on your API response
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  shortCode: string | null;
  birthdate: string | null;
  level: string | null;
  guardianId: string;
  guardian: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StudentsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Student[];
}

export default function StudentsListClient({
  initialData,
  initialQuery,
  initialPage,
  initialEnrollmentStatus,
  initialLevel,
  user,
}: {
  initialData: StudentsResponse;
  initialQuery: string;
  initialPage: number;
  initialEnrollmentStatus: string;
  initialLevel: string;
  user: CurrentUser;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [enrollmentStatus, setEnrollmentStatus] = useState(
    initialEnrollmentStatus
  );
  const [level, setLevel] = useState(initialLevel);
  const [loading, setLoading] = useState(false);

  const displayEnrollmentStatus = enrollmentStatus || "all";
  const displayLevel = level || "all";

  // Calculate age helper
  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return "—";

    const birth = new Date(birthdate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return `${years - 1}y`;
    }
    return `${years}y`;
  };

  // Update URL and fetch data
  const updateFilters = async (
    newQuery?: string,
    newPage?: number,
    newEnrollmentStatus?: string,
    newLevel?: string
  ) => {
    const params = new URLSearchParams(searchParams);

    if (newQuery !== undefined) params.set("query", newQuery);
    if (newPage !== undefined) params.set("page", newPage.toString());
    if (newEnrollmentStatus !== undefined) {
      if (newEnrollmentStatus)
        params.set("enrollmentStatus", newEnrollmentStatus);
      else params.delete("enrollmentStatus");
    }
    if (newLevel !== undefined) {
      if (newLevel && newLevel !== "all") params.set("level", newLevel);
      else params.delete("level");
    }

    router.push(`/students?${params.toString()}`);

    // Fetch new data
    try {
      setLoading(true);
      const newData = await searchStudents({
        query: newQuery ?? query,
        page: newPage ?? initialPage,
        pageSize: 20,
        enrollmentStatus: newEnrollmentStatus ?? enrollmentStatus,
        level: (newLevel === "all" ? "" : newLevel) ?? level,
      });
      setData(newData);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    updateFilters(query, 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleEnrollmentStatusChange = (value: string) => {
    setEnrollmentStatus(value);
    updateFilters(undefined, 1, value);
  };

  const handleLevelChange = (value: string) => {
    setLevel(value);
    updateFilters(undefined, 1, undefined, value);
  };

  const handlePageChange = (page: number) => {
    updateFilters(undefined, page);
  };

  const handleRowClick = (studentId: string) => {
    router.push(`/students/${studentId}`);
  };

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 hidden sm:block">
            Manage student profiles and enrollments
          </p>
        </div>
        <PermissionGate
          allowedRoles={["admin", "manager"]}
          currentRole={user.role}
        >
          <Button onClick={() => router.push("/admin/students/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
          </Button>
        </PermissionGate>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Search */}
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or short code..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={enrollmentStatus || "all"}
                onValueChange={handleEnrollmentStatusChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Enrollment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="active">Active Enrollments</SelectItem>
                  <SelectItem value="inactive">
                    No Active Enrollments
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={level || "all"} onValueChange={handleLevelChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">No Level Set</SelectItem>
                  <SelectGroup>
                    <SelectLabel className="text-xs">Preschool</SelectLabel>
                    {PRESCHOOL_LEVELS.map((levelOption) => (
                      <SelectItem key={levelOption} value={levelOption}>
                        {levelOption}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs">Swimmer</SelectLabel>
                    {SWIMMER_LEVELS.map((levelOption) => (
                      <SelectItem key={levelOption} value={levelOption}>
                        {levelOption}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs">Swim Team</SelectLabel>
                    {SWIMTEAM_LEVELS.map((levelOption) => (
                      <SelectItem key={levelOption} value={levelOption}>
                        {levelOption}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {data.items.length} of {data.total} students
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          )}

          {!loading && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-600 text-center">
                {query || enrollmentStatus || level
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first student"}
              </p>
            </div>
          )}

          {!loading && data.items.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium text-gray-900">
                        Student
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Code
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Age
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Level
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Guardian
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Enrolled
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(student.id)}
                      >
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          {student.shortCode || "—"}
                        </td>
                        <td className="p-4 text-gray-600">
                          {calculateAge(student.birthdate)}
                        </td>
                        <td className="p-4">
                          {student.level ? (
                            <Badge variant="outline">{student.level}</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-gray-900 font-medium hover:text-blue-600 hover:underline">
                            <Link
                              href={`/guardians/${student.guardian.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {student.guardian.fullName}
                            </Link>
                          </div>
                          <PermissionGate
                            allowedRoles={["admin", "manager"]}
                            currentRole={user.role}
                          >
                            <div className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
                              <Link
                                href={`/guardians/${student.guardian.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {student.guardian.email}
                              </Link>
                            </div>
                          </PermissionGate>
                          <PermissionGate
                            allowedRoles={["admin", "manager"]}
                            currentRole={user.role}
                          >
                            <div className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
                              <Link
                                href={`/guardians/${student.guardian.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {student.guardian.phone}
                              </Link>
                            </div>
                          </PermissionGate>
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(student.createdAt).toLocaleDateString(
                            "en-CA"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {data.items.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(student.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.level && (
                        <Badge variant="outline" className="text-xs">
                          {student.level}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Code: {student.shortCode || "—"}</div>
                      <div>Age: {calculateAge(student.birthdate)}</div>
                      <div>
                        Guardian:{" "}
                        <Link
                          href={`/guardians/${student.guardian.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {student.guardian.fullName}
                        </Link>
                      </div>
                      <div>
                        Enrolled:{" "}
                        {new Date(student.createdAt).toLocaleDateString(
                          "en-CA"
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {data.page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
