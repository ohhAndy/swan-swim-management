import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/lib/api/tasks-client";
import { Calendar, MoreVertical, Flag } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  canEdit: boolean;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-700 border-gray-500/20",
};

const priorityIcons = {
  low: <Flag className="w-3 h-3 text-blue-500" />,
  medium: <Flag className="w-3 h-3 text-yellow-500" />,
  high: <Flag className="w-3 h-3 text-orange-500" />,
  urgent: <Flag className="w-3 h-3 text-red-500" />,
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit,
}: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={statusColors[task.status] || ""}
              >
                {task.status.replace("_", " ")}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-medium">
                {priorityIcons[task.priority]}
                {task.priority}
              </div>
            </div>
            <CardTitle className="text-base font-semibold leading-snug">
              {task.title}
            </CardTitle>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(task.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {task.description && (
          <p className="text-sm text-foreground mb-4 line-clamp-3">
            {task.description}
          </p>
        )}
        {task.dueDate && (
          <div className="flex justify-between items-center gap-2 pb-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-sm">To complete by:</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm text-foreground">
              {task.dueDate.split("T")[0]}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-2 text-sm">
          {task.assignedTo && (
            <div className="flex justify-between text-muted-foreground">
              <span>Assigned to:</span>
              <span className="font-medium text-foreground">
                {task.assignedTo.fullName}
              </span>
            </div>
          )}
          {task.createdBy && (
            <div className="flex justify-between text-muted-foreground">
              <span>Assigned by:</span>
              <span className="font-medium text-foreground">
                {task.createdBy.fullName}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        {task.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(task.id, "completed")}
            className="w-full"
          >
            Mark Complete
          </Button>
        )}
        {task.status === "completed" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onStatusChange(task.id, "pending")}
            className="w-full"
          >
            Reopen
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
