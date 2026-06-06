import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Role } from "@/types"

const roleRoutes: Record<string, Role[]> = {
  "/dashboard/settings": ["ADMIN"],
  "/dashboard/billing": ["ADMIN", "CASHIER"],
  "/dashboard/results": ["ADMIN", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"],
  "/dashboard/reports": ["ADMIN", "DOCTOR"],
  "/dashboard/registration": ["ADMIN", "RECEPTIONIST"],
  "/dashboard/checkup": ["ADMIN", "RECEPTIONIST", "LAB", "RADIOLOGY", "DOCTOR", "NURSE"],
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const role = token.role as Role
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
