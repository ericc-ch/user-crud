"use client"

import { use, useState, useMemo, useTransition } from "react"
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { getColumns, type User } from "./columns"
import { UserFormDialog } from "./user-form-dialog"
import { Button } from "@/components/ui/button"
import { deleteUser } from "./actions"

type UsersResponse = {
  data: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type UsersTableProps = {
  usersPromise: Promise<UsersResponse>
  roles: { id: string; name: string }[]
}

export function UsersTable({ usersPromise, roles }: UsersTableProps) {
  const response = use(usersPromise)
  const [isPending, startTransition] = useTransition()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString,
    sortBy: parseAsString.withDefault("createdAt"),
    sortOrder: parseAsString.withDefault("desc"),
  })

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return

    startTransition(async () => {
      try {
        await deleteUser(user.id)
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    })
  }

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), [])

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsCreateDialogOpen(false)
      setEditingUser(undefined)
    }
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
        data={response.data}
        pageCount={response.totalPages}
        params={params}
        onParamsChange={setParams}
        isPending={isPending}
      />
      <UserFormDialog
        open={isCreateDialogOpen || !!editingUser}
        onOpenChange={handleDialogClose}
        user={editingUser}
        roles={roles}
      />
    </>
  )
}
