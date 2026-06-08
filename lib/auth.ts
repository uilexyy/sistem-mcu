import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import * as bcrypt from "bcryptjs"
import type { Role } from "@/types"
import { mockUsers } from "@/lib/data"
import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface User {
    role: Role
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        const mockUser = mockUsers.find((u) => u.email === email)
        if (mockUser && password === "123") {
          return { id: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role }
        }

        try {
          const dbUser = await prisma.user.findUnique({ where: { email } })
          if (dbUser && dbUser.password && dbUser.isActive) {
            const valid = await bcrypt.compare(password, dbUser.password)
            if (valid) {
              return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role as Role }
            }
          }
        } catch {
          return null
        }

        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
      }
      return session
    },
  },
})
