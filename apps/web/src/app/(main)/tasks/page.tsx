"use client";

import { useGetCurrentUser } from "@/lib/auth/hooks/use-get-current-user";
import {
  CreateTaskInput,
  deleteTask,
  getTasks,
  Task,
  updateTask,
} from "@/lib/api/tasks-client";
import { getStaffUsers, StaffUser } from "@/lib/api/users-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  const { user } = useGetCurrentUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my_tasks" | "created_by_me">(
    "my_tasks"
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const canCreate = user?.role === "admin" || user?.role === "manager";
  const canEdit = canCreate; // Simplify for now

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedStaff] = await Promise.all([
        getTasks(),
        getStaffUsers(),
      ]);
      setTasks(fetchedTasks);
      setStaffUsers(fetchedStaff);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "my_tasks") return task.assignedToId === user?.staffUserId;
    if (filter === "created_by_me")
      return task.createdById === user?.staffUserId;
    return true;
  });

  const handleSave = async (data: CreateTaskInput) => {
    if (editingTask) {
      // Update
      await updateTask(editingTask.id, data);
    } else {
      // Create
      // Verify we have a create function exposed or call fetch directly.
      // I created createTask in tasks-client.ts. I need to import it.
      const { createTask } = await import("@/lib/api/tasks-client");
      await createTask(data);
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await deleteTask(id);
    await loadData();
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    await updateTask(id, { status });
    await loadData();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage assignments and to-dos for staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="my_tasks">My Tasks</SelectItem>
              <SelectItem value="created_by_me">Created by Me</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Button
              onClick={() => {
                setEditingTask(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No tasks found.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              onEdit={(t) => {
                setEditingTask(t);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        staffUsers={staffUsers}
        onSuccess={handleSave}
      />
    </div>
  );
}
