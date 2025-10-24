import { queryOptions } from "@tanstack/react-query"

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export type Role = {
  id: string
  name: string
  permissions: string
  createdAt: number
  updatedAt: number
}

export type RolesResponse = {
  data: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type RolesListParams = {
  page: number
  pageSize: number
  search?: string | null
  sortBy: string
  sortOrder: string
}

async function fetchRoles(params: RolesListParams): Promise<RolesResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    ...(params.search && { search: params.search }),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })

  const res = await fetch(`${baseUrl}/api/roles?${queryParams}`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch roles")
  }

  return res.json()
}

export type CreateRoleInput = {
  name: string
  permissions: string[]
}

export type UpdateRoleInput = {
  id: string
  name: string
  permissions: string[]
}

async function createRole(input: CreateRoleInput): Promise<Role> {
  const res = await fetch(`${baseUrl}/api/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create role" }))
    throw new Error(error.error || "Failed to create role")
  }

  return res.json()
}

async function updateRole(input: UpdateRoleInput): Promise<Role> {
  const res = await fetch(`${baseUrl}/api/roles/${input.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name: input.name,
      permissions: input.permissions,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update role" }))
    throw new Error(error.error || "Failed to update role")
  }

  return res.json()
}

async function deleteRole(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/roles/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete role" }))
    throw new Error(error.error || "Failed to delete role")
  }
}

export const roleQueries = {
  all: () => ["roles"],
  lists: () => [...roleQueries.all(), "list"],
  list: (params: RolesListParams) =>
    queryOptions({
      queryKey: [...roleQueries.lists(), params],
      queryFn: () => fetchRoles(params),
    }),
}

export const roleMutations = {
  create: createRole,
  update: updateRole,
  delete: deleteRole,
}
