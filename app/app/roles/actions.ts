"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

async function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
}

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')
  
  return {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
  }
}

type FormState = {
  error?: string
  success?: boolean
}

export async function createRoleAction(_prevState: FormState | null, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const permissions = formData.getAll('permissions') as string[]

  if (!name) {
    return { error: "Name is required" }
  }

  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/roles`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, permissions }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create role" }))
    return { error: error.error || "Failed to create role" }
  }

  revalidatePath("/app/roles")
  return { success: true }
}

export async function updateRoleAction(id: string, _prevState: FormState | null, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const permissions = formData.getAll('permissions') as string[]

  if (!name) {
    return { error: "Name is required" }
  }

  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/roles/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ name, permissions }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update role" }))
    return { error: error.error || "Failed to update role" }
  }

  revalidatePath("/app/roles")
  return { success: true }
}

export async function deleteRole(id: string) {
  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/roles/${id}`, {
    method: "DELETE",
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete role" }))
    throw new Error(error.error || "Failed to delete role")
  }

  revalidatePath("/app/roles")
  return await res.json()
}
