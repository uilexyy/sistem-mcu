import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { Role } from "@/types"

export async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user as { id: string; name: string; email: string; role: Role }
}

export function requireRole(user: { role: Role } | null, allowedRoles: Role[]) {
  if (!user) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 })
  }
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke fitur ini" }, { status: 403 })
  }
  return null
}

export function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan"
  return NextResponse.json({ error: message }, { status })
}
