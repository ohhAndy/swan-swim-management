import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateTaskInput, Task } from "@/lib/api/tasks-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { StaffUser } from "@/lib/api/users-client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
});

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSuccess: (data: CreateTaskInput) => Promise<void>;
  staffUsers: StaffUser[];
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
  staffUsers,
}: TaskDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignedToId: "unassigned",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        assignedToId: task.assignedToId || "unassigned",
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        assignedToId: "unassigned",
        dueDate: "",
      });
    }
  }, [task, form, open]);

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    await onSuccess({
      ...values,
      assignedToId:
        values.assignedToId === "unassigned" ? undefined : values.assignedToId,
      dueDate: values.dueDate === "" ? undefined : values.dueDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} disabled={loading} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              disabled={loading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Controller
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {staffUsers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              type="date"
              id="dueDate"
              {...form.register("dueDate")}
              min="1900-01-01"
              disabled={loading}
            />
            {form.formState.errors.dueDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.dueDate.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
