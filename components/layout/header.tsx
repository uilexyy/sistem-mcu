"use client"

import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User as UserIcon } from "lucide-react"
import { mockUser } from "@/lib/data"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/patients": "Data Pasien",
  "/dashboard/registration": "Pendaftaran MCU",
  "/dashboard/checkup": "Antrian & Stasiun Pemeriksaan",
  "/dashboard/results": "Input Hasil Pemeriksaan",
  "/dashboard/reports": "Laporan & Sertifikat",
  "/dashboard/billing": "Billing & Pembayaran",
  "/dashboard/settings": "Pengaturan",
}

export function Header() {
  const pathname = usePathname()
  const title = Object.entries(pageTitles).find(([key]) =>
    key === "/dashboard" ? pathname === key : pathname.startsWith(key)
  )?.[1] || "Sistem MCU"

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {mockUser.name?.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-left text-sm">
              <p className="font-medium">{mockUser.name}</p>
              <p className="text-xs text-muted-foreground">{mockUser.role}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
