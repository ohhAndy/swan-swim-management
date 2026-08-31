import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ChevronRight } from "lucide-react";
import type { Student } from "@/lib/types/models";

interface StudentQuickLinksCardProps {
  student: Student;
}

export function StudentQuickLinksCard({ student }: StudentQuickLinksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Link
          href={`/students/${student.id}/makeups`}
          className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors group border-t first:border-t-0"
        >
          <div className="flex items-center gap-2 text-gray-700 group-hover:text-blue-600">
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span>Make-up History</span>
            {student.makeUps && student.makeUps.length > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700">
                {student.makeUps.length}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </CardContent>
    </Card>
  );
}
