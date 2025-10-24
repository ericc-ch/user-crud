import { queryOptions } from "@tanstack/react-query"

export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: number
  updatedAt: number
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

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
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
