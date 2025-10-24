"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { getColumns, type User } from "./columns"
import { UserFormDialog } from "./user-form-dialog"
import { Button } from "@/components/ui/button"
import { deleteUser } from "./actions"
import { userQueries } from "@/lib/queries/users.queries"

export function UsersTable() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)

  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    search: null as string | null,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  const handleParamsChange = (values: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...values }))
  }

  const { data: usersData, isPending } = useQuery(
    userQueries.list({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })
  )

  const { data: roles = [] } = useQuery(userQueries.roles())

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return

    try {
      await deleteUser(user.id)
      queryClient.invalidateQueries({ queryKey: userQueries.lists() })
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const columns = getColumns(handleEdit, handleDelete)

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false)
      setEditingUser(undefined)
    }
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: userQueries.lists() })
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={usersData?.data ?? []}
        pageCount={usersData?.totalPages ?? 0}
        params={params}
        onParamsChange={handleParamsChange}
        isPending={isPending}
      />
      <UserFormDialog
        open={isCreateDialogOpen || !!editingUser}
        onOpenChange={handleDialogClose}
        user={editingUser}
        roles={roles}
        onSuccess={handleSuccess}
      />
    </>
  )
}
