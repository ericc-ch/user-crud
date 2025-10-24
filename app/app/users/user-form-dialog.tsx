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
import { createUserAction, updateUserAction } from "./actions";

type Role = {
  id: string;
  name: string;
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?:
    | {
        id: string;
        name: string;
        email: string;
        roleIds?: string[];
      }
    | undefined;
  roles: Role[];
  onSuccess?: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSuccess,
}: UserFormDialogProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>(
    user?.roleIds || []
  );

  const createAction = createUserAction.bind(null);
  const updateAction = user ? updateUserAction.bind(null, user.id) : null;

  const [createState, createFormAction, createPending] = useActionState(
    createAction,
    null
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction || createAction,
    null
  );

  const state = user ? updateState : createState;
  const formAction = user ? updateFormAction : createFormAction;
  const isPending = user ? updatePending : createPending;

  React.useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      formRef.current?.reset();
      setSelectedRoleIds([]);
      onSuccess?.();
    }
  }, [state?.success, onOpenChange, onSuccess]);

  React.useEffect(() => {
    if (open) {
      setSelectedRoleIds(user?.roleIds || []);
      formRef.current?.reset();
    }
  }, [open, user]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {user
                ? "Update the user details below."
                : "Add a new user to the system."}
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
                placeholder="John Doe"
                defaultValue={user?.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                defaultValue={user?.email}
                required
              />
            </div>
            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Roles</Label>
              <div className="grid gap-3 rounded-md border p-4 max-h-[200px] overflow-y-auto">
                {roles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No roles available
                  </div>
                ) : (
                  roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.id}
                        name="roleIds"
                        value={role.id}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label
                        htmlFor={role.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.name}
                      </Label>
                    </div>
                  ))
                )}
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
              {isPending ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
