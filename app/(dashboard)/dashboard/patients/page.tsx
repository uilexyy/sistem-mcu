"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Search, Trash2 } from "lucide-react"
import { mockPatients } from "@/lib/data"
import { formatDate } from "@/lib/utils"
import { createPatientSchema } from "@/lib/validations"
import Link from "next/link"

export default function PatientsPage() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const filtered = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.medicalRecordNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.nik && p.nik.includes(search))
  )

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))
    const result = createPatientSchema.safeParse(data)
    if (!result.success) {
      toast.error("Data pasien tidak valid", {
        description: result.error.errors.map((e) => e.message).join(", "),
      })
      return
    }
    toast.success("Pasien berhasil ditambahkan")
    setOpen(false)
    form.reset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pasien..."
            className="pl-8 w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Pasien
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>Tambah Pasien Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" placeholder="Nama pasien" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>
                    <Input id="nik" name="nik" placeholder="16 digit" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select name="gender" required>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input id="phone" name="phone" placeholder="08123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input id="address" name="address" placeholder="Alamat lengkap" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Golongan Darah</Label>
                  <Select name="bloodType">
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Pasien</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: "rm", header: "No. RM", cell: (p) => <span className="font-mono text-xs">{p.medicalRecordNumber}</span> },
              { key: "name", header: "Nama", cell: (p) => <span className="font-medium">{p.name}</span> },
              { key: "nik", header: "NIK", cell: (p) => p.nik || "-" },
              { key: "gender", header: "Gender", cell: (p) => p.gender === "MALE" ? "Laki-laki" : "Perempuan" },
              { key: "phone", header: "No. Telepon", cell: (p) => p.phone || "-" },
              { key: "actions", header: "", cell: (p) => (
                <div className="flex gap-1">
                  <Link href={`/dashboard/patients/${p.id}`}>
                    <Button variant="ghost" size="sm">Detail</Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pasien?</AlertDialogTitle>
                        <AlertDialogDescription>Data pasien {p.name} akan dihapus permanen. Lanjutkan?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive" onClick={() => toast.success(`Pasien ${p.name} dihapus`)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )},
            ]}
            data={filtered}
            pageSize={10}
            emptyMessage="Pasien tidak ditemukan"
          />
        </CardContent>
      </Card>
    </div>
  )
}
