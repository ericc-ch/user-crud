"use client"

import { use, useState, useMemo, useTransition } from "react"
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { getColumns, type Role } from "./columns"
import { RoleFormDialog } from "./role-form-dialog"
import { Button } from "@/components/ui/button"
import { deleteRole } from "./actions"

type RolesResponse = {
  data: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type RolesTableProps = {
  rolesPromise: Promise<RolesResponse>
}

export function RolesTable({ rolesPromise }: RolesTableProps) {
  const response = use(rolesPromise)
  const [isPending, startTransition] = useTransition()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined)

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString,
    sortBy: parseAsString.withDefault("createdAt"),
    sortOrder: parseAsString.withDefault("desc"),
  })

  const handleEdit = (role: Role) => {
    setEditingRole(role)
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete "${role.name}"?`)) return

    startTransition(async () => {
      try {
        await deleteRole(role.id)
      } catch (error) {
        console.error("Error deleting role:", error)
      }
    })
  }

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), [])

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false)
      setEditingRole(undefined)
    }
  }

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
        data={response.data}
        pageCount={response.totalPages}
        params={params}
        onParamsChange={setParams}
        isPending={isPending}
      />
      <RoleFormDialog
        open={isCreateDialogOpen || !!editingRole}
        onOpenChange={handleDialogClose}
        role={editingRole}
      />
    </>
  )
}
