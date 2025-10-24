import { queryOptions } from "@tanstack/react-query"

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

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/roles?${queryParams}`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch roles")
  }

  return res.json()
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
