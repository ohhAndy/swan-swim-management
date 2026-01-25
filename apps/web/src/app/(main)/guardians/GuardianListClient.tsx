"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Users, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchGuardiansPage, GuardianLite } from "@/lib/api/guardian-client";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { CurrentUser } from "@/lib/auth/user";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuardianCreateModal } from "@/components/guardians/GuardianCreateModal";

interface GuardiansResponse {
  total: number;
  page: number;
  pageSize: number;
  items: GuardianLite[];
}

export default function GuardianListClient({
  initialData,
  initialQuery,
  initialPage,
  initialWaiverStatus,
  user,
}: {
  initialData: GuardiansResponse;
  initialQuery: string;
  initialPage: number;
  initialWaiverStatus?: "signed" | "pending";
  user: CurrentUser;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [waiverStatus, setWaiverStatus] = useState<
    "signed" | "pending" | undefined
  >(initialWaiverStatus);

  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Update URL and fetch data
  const updateFilters = async (
    newQuery?: string,
    newPage?: number,
    newWaiverStatus?: "signed" | "pending" | "all",
  ) => {
    const params = new URLSearchParams(searchParams);

    if (newQuery !== undefined) params.set("query", newQuery);
    if (newPage !== undefined) params.set("page", newPage.toString());

    if (newWaiverStatus) {
      if (newWaiverStatus === "all") {
        params.delete("waiverStatus");
        setWaiverStatus(undefined);
      } else {
        params.set("waiverStatus", newWaiverStatus);
        setWaiverStatus(newWaiverStatus);
      }
    }

    router.push(`/guardians?${params.toString()}`);

    // Fetch new data
    try {
      setLoading(true);
      const effectiveWaiverStatus =
        newWaiverStatus === "all"
          ? undefined
          : (newWaiverStatus ?? waiverStatus);

      const newData = await searchGuardiansPage(
        newQuery ?? query,
        newPage ?? initialPage,
        20,
        { waiverStatus: effectiveWaiverStatus },
      );
      setData(newData);
    } catch (error) {
      console.error("Failed to fetch guardians:", error);
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

  const handlePageChange = (page: number) => {
    updateFilters(undefined, page);
  };

  const handleRowClick = (guardianId: string) => {
    router.push(`/guardians/${guardianId}`);
  };

  const totalPages = Math.ceil(data.total / data.pageSize);

  const handleWaiverFilterChange = (val: string) => {
    updateFilters(undefined, 1, val as "signed" | "pending" | "all");
  };

  // ...

  return (
    <>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Guardian</DialogTitle>
            <DialogDescription>
              Create a new guardian profile.
            </DialogDescription>
          </DialogHeader>
          <GuardianCreateModal
            onCreated={(g) => {
              setIsCreateOpen(false);
              router.push(`/guardians/${g.id}`);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guardians</h1>
          <p className="text-gray-600 hidden sm:block">
            Manage guardian profiles and their waivers
          </p>
        </div>
        <PermissionGate
          allowedRoles={["super_admin", "admin", "manager"]}
          currentRole={user.role}
        >
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Guardian
          </Button>
        </PermissionGate>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="max-w-md"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-[200px]">
              <Select
                value={waiverStatus || "all"}
                onValueChange={handleWaiverFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Waiver Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Waiver Pending</SelectItem>
                  <SelectItem value="signed">Waiver Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {data.items.length} of {data.total} guardians
          </div>
        </CardContent>
      </Card>

      {/* Guardians Table */}
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
                No guardians found
              </h3>
              <p className="text-gray-600 text-center">
                {query
                  ? "Try adjusting your search"
                  : "Get started by adding your first guardian"}
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
                        Name
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Students
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Email
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Phone
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        Waiver
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((guardian) => (
                      <tr
                        key={guardian.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(guardian.id)}
                      >
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {guardian.fullName}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          {guardian.students && guardian.students.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {guardian.students.map((s, i) => (
                                <span key={i} className="whitespace-nowrap">
                                  {s.firstName} {s.lastName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-gray-600">{guardian.email}</td>
                        <td className="p-4 text-gray-600">{guardian.phone}</td>
                        <td className="p-4">
                          {guardian.waiverSigned ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                              <Check className="w-3 h-3 mr-1" /> Signed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-gray-500 border-gray-300"
                            >
                              <X className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {data.items.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(guardian.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {guardian.fullName}
                      </div>
                      {guardian.waiverSigned ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none text-xs">
                          <Check className="w-3 h-3 mr-1" /> Signed
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-500 border-gray-300 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        Students:{" "}
                        {guardian.students && guardian.students.length > 0
                          ? guardian.students
                              .map((s) => `${s.firstName} ${s.lastName}`)
                              .join(", ")
                          : "—"}
                      </div>
                      <div>Email: {guardian.email}</div>
                      <div>Phone: {guardian.phone}</div>
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
