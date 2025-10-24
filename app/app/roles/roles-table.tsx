"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DataTable } from "./data-table";
import { getColumns, type Role } from "./columns";
import { RoleFormDialog } from "./role-form-dialog";
import { Button } from "@/components/ui/button";
import { deleteRole } from "./actions";
import { roleQueries } from "@/lib/queries/roles.queries";

export function RolesTable() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    search: null as string | null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleParamsChange = (values: Partial<typeof params>) => {
    setParams((prev) => ({ ...prev, ...values }));
  };

  const { data: rolesData, isPending } = useQuery(
    roleQueries.list({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
  );

  const handleEdit = (role: Role) => {
    setEditingRole(role);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete "${role.name}"?`)) return;

    try {
      await deleteRole(role.id);
      queryClient.invalidateQueries({ queryKey: roleQueries.lists() });
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const columns = getColumns(handleEdit, handleDelete);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false);
      setEditingRole(undefined);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: roleQueries.lists() });
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rolesData?.data ?? []}
        pageCount={rolesData?.totalPages ?? 0}
        params={params}
        onParamsChange={handleParamsChange}
        isPending={isPending}
      />
      <RoleFormDialog
        open={isCreateDialogOpen || !!editingRole}
        onOpenChange={handleDialogClose}
        role={editingRole}
        onSuccess={handleSuccess}
      />
    </>
  );
}
