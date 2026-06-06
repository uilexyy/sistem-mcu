"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

const roleAccounts = [
  { email: "admin@rs.com", label: "Admin", role: "ADMIN" },
  { email: "daftar@rs.com", label: "Pendaftaran", role: "RECEPTIONIST" },
  { email: "lab@rs.com", label: "Lab", role: "LAB" },
  { email: "radio@rs.com", label: "Radiologi", role: "RADIOLOGY" },
  { email: "dokter@rs.com", label: "Dokter", role: "DOCTOR" },
]

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(email: string) {
    setIsLoading(true)
    const result = await signIn("credentials", {
      email,
      password: "123",
      redirect: false,
    })
    if (result?.ok) {
      toast.success("Berhasil masuk")
      router.push("/dashboard")
    } else {
      toast.error("Gagal masuk")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Sistem MCU</CardTitle>
        <CardDescription>Pilih role untuk masuk (demo)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {roleAccounts.map((acc) => (
          <Button
            key={acc.email}
            variant="outline"
            className="w-full justify-between h-12"
            disabled={isLoading}
            onClick={() => handleLogin(acc.email)}
          >
            <span>{acc.label}</span>
            <Badge variant="secondary" className="text-xs">{acc.role}</Badge>
          </Button>
        ))}
        <p className="text-xs text-center text-muted-foreground pt-2">
          Password: 123 (semua akun)
        </p>
      </CardContent>
    </Card>
  )
}
