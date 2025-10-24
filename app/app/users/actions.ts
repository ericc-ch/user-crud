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

export async function createUserAction(_prevState: FormState | null, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const roleIds = formData.getAll('roleIds') as string[]

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email, password, roleIds }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create user" }))
    return { error: error.error || "Failed to create user" }
  }

  revalidatePath("/app/users")
  return { success: true }
}

export async function updateUserAction(id: string, _prevState: FormState | null, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const roleIds = formData.getAll('roleIds') as string[]

  if (!name || !email) {
    return { error: "Name and email are required" }
  }

  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/users/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ name, email, roleIds }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update user" }))
    return { error: error.error || "Failed to update user" }
  }

  revalidatePath("/app/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  const baseUrl = await getBaseUrl()
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${baseUrl}/api/users/${id}`, {
    method: "DELETE",
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete user" }))
    throw new Error(error.error || "Failed to delete user")
  }

  revalidatePath("/app/users")
  return await res.json()
}
