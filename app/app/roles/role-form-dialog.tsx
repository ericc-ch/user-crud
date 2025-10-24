"use client";

import * as React from "react";
import { useActionState } from "react";

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
import { createRoleAction, updateRoleAction } from "./actions";

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
  const formRef = React.useRef<HTMLFormElement>(null);

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

  const createAction = createRoleAction.bind(null);
  const updateAction = role ? updateRoleAction.bind(null, role.id) : null;

  const [createState, createFormAction, createPending] = useActionState(
    createAction,
    null
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction || createAction,
    null
  );

  const state = role ? updateState : createState;
  const formAction = role ? updateFormAction : createFormAction;
  const isPending = role ? updatePending : createPending;

  React.useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      formRef.current?.reset();
      setSelectedPermissions([]);
      onSuccess?.();
    }
  }, [state?.success, onOpenChange, onSuccess]);

  React.useEffect(() => {
    if (open) {
      setSelectedPermissions(defaultPermissions);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              {role
                ? "Update the role details below."
                : "Add a new role to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {state.error}
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
