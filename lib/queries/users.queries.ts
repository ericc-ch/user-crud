import { queryOptions } from "@tanstack/react-query"

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: number
  updatedAt: number
  roleIds?: string[]
}

export type UsersResponse = {
  data: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type UsersListParams = {
  page: number
  pageSize: number
  search?: string | null
  sortBy: string
  sortOrder: string
}

async function fetchUsers(params: UsersListParams): Promise<UsersResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
    ...(params.search && { search: params.search }),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })

  const res = await fetch(`${baseUrl}/api/users?${queryParams}`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch users")
  }

  return res.json()
}

export type RoleOption = {
  id: string
  name: string
}

async function fetchRolesForSelect(): Promise<RoleOption[]> {
  const res = await fetch(`${baseUrl}/api/roles?pageSize=100`, {
    credentials: "include",
  })

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.data.map((role: { id: string; name: string }) => ({
    id: role.id,
    name: role.name,
  }))
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  roleIds: string[]
}

export type UpdateUserInput = {
  id: string
  name: string
  email: string
  roleIds: string[]
}

async function createUser(input: CreateUserInput): Promise<User> {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create user" }))
    throw new Error(error.error || "Failed to create user")
  }

  return res.json()
}

async function updateUser(input: UpdateUserInput): Promise<User> {
  const res = await fetch(`${baseUrl}/api/users/${input.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      roleIds: input.roleIds,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update user" }))
    throw new Error(error.error || "Failed to update user")
  }

  return res.json()
}

async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete user" }))
    throw new Error(error.error || "Failed to delete user")
  }
}

export const userQueries = {
  all: () => ["users"],
  lists: () => [...userQueries.all(), "list"],
  list: (params: UsersListParams) =>
    queryOptions({
      queryKey: [...userQueries.lists(), params],
      queryFn: () => fetchUsers(params),
    }),
  roles: () =>
    queryOptions({
      queryKey: ["roles", "select"],
      queryFn: fetchRolesForSelect,
      staleTime: 5 * 60 * 1000,
    }),
}

export const userMutations = {
  create: createUser,
  update: updateUser,
  delete: deleteUser,
}
