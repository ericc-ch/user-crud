"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { roleMutations, roleQueries } from "@/lib/queries/roles.queries";

const AVAILABLE_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "roles:read",
  "roles:write",
  "roles:delete",
] as const;

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
  onSuccess?: () => void;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleFormDialogProps) {
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const defaultPermissions = React.useMemo(() => {
    if (!role) return [];
    try {
      const perms = JSON.parse(role.permissions);
      return Array.isArray(perms) ? perms : [];
    } catch {
      return [];
    }
  }, [role]);

  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>(
    defaultPermissions
  );

  const createMutation = useMutation({
    mutationFn: roleMutations.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueries.lists() });
      onOpenChange(false);
      formRef.current?.reset();
      setSelectedPermissions([]);
      setError(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: roleMutations.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueries.lists() });
      onOpenChange(false);
      formRef.current?.reset();
      setSelectedPermissions([]);
      setError(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    if (open) {
      setSelectedPermissions(defaultPermissions);
      setError(null);
      formRef.current?.reset();
    }
  }, [open, defaultPermissions]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (role) {
      updateMutation.mutate({
        id: role.id,
        name,
        permissions: selectedPermissions,
      });
    } else {
      createMutation.mutate({
        name,
        permissions: selectedPermissions,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} onSubmit={handleSubmit} key={role?.id || 'create'}>
          <DialogHeader>
            <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {role
                ? "Update the role details below."
                : "Add a new role to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Admin"
                defaultValue={role?.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="grid gap-3 rounded-md border p-4">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      name="permissions"
                      value={permission}
                      checked={selectedPermissions.includes(permission)}
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
