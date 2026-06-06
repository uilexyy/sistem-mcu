"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </SessionProvider>
    </ThemeProvider>
  )
}
