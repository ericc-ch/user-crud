"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export type Role = {
  id: string;
  name: string;
  permissions: string;
  createdAt: number;
  updatedAt: number;
};

export function getColumns(
  onEdit: (role: Role) => void,
  onDelete: (role: Role) => void,
): ColumnDef<Role>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const permissionsStr = row.getValue("permissions") as string;
        let permissions: string[] = [];
        try {
          permissions = JSON.parse(permissionsStr);
        } catch {
          permissions = [];
        }
        return (
          <div className="flex gap-1">
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {permissions.length}{" "}
              {permissions.length === 1 ? "permission" : "permissions"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(role)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(role)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
