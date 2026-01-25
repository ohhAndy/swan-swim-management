"use client";

import { useEffect, useState } from "react";
import { getAuditLogs, AuditLog } from "@/lib/api/audit-logs-client";
import { getCurrentUserClient } from "@/lib/auth/user-client";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUserClient();
      if (!user || user.role !== "super_admin") {
        router.replace("/access-denied");
      } else {
        fetchLogs();
      }
    }
    checkAccess();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data, total } = await getAuditLogs(page);
      setLogs(data);
      setTotal(total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-fredoka text-[#2d334a]">
          System Audit Logs
        </h1>
        <Button variant="outline" onClick={() => fetchLogs()}>
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    Loading logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-gray-600">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.staff.fullName}
                    <div className="text-xs text-gray-400">
                      {log.staff.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-sm text-gray-600">
                    {log.staff.role.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <span className="text-xs text-gray-400 ml-2">
                        #{log.entityId.slice(-4)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs font-mono text-gray-500">
                    {JSON.stringify(log.changes || log.metadata)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Showing {logs.length} of {total} records
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < 20}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
