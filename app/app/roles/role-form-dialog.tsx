"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createRole, updateRole } from "./actions";

const AVAILABLE_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "roles:read",
  "roles:write",
  "roles:delete",
] as const;

const roleFormInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()),
});

type RoleFormInputValues = z.infer<typeof roleFormInputSchema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?:
    | {
        id: string;
        name: string;
        permissions: string;
      }
    | undefined;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: RoleFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const defaultPermissions = React.useMemo(() => {
    if (!role) return [];
    try {
      const perms = JSON.parse(role.permissions);
      return Array.isArray(perms) ? perms : [];
    } catch {
      return [];
    }
  }, [role]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormInputValues>({
    resolver: zodResolver(roleFormInputSchema),
    defaultValues: {
      name: role?.name || "",
      permissions: defaultPermissions,
    },
  });

  const selectedPermissions = watch("permissions");

  React.useEffect(() => {
    if (open) {
      reset({
        name: role?.name || "",
        permissions: defaultPermissions,
      });
    }
  }, [open, role, defaultPermissions, reset]);

  const togglePermission = (permission: string) => {
    const current = selectedPermissions || [];
    if (current.includes(permission)) {
      setValue(
        "permissions",
        current.filter((p) => p !== permission)
      );
    } else {
      setValue("permissions", [...current, permission]);
    }
  };

  const onSubmit = async (data: RoleFormInputValues) => {
    startTransition(async () => {
      try {
        if (role) {
          await updateRole(role.id, {
            name: data.name,
            permissions: data.permissions,
          });
        } else {
          await createRole({
            name: data.name,
            permissions: data.permissions,
          });
        }
        onOpenChange(false);
      } catch (error) {
        console.error("Error saving role:", error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {role
                ? "Update the role details below."
                : "Add a new role to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Admin" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="grid gap-3 rounded-md border p-4">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions?.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <Label
                      htmlFor={permission}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.permissions && (
                <p className="text-sm text-destructive">
                  {errors.permissions.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : role ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
