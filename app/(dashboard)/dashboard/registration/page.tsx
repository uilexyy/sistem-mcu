"use client"

import { useState, useMemo } from "react"
import { useDebounce } from "@/lib/use-debounce"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, UserPlus, Package, AlertCircle } from "lucide-react"
import { mockPatients, mockPackages } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { createCheckupRegistrationSchema } from "@/lib/validations"

export default function RegistrationPage() {
  const [searchPatient, setSearchPatient] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState("2025-06-02")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(searchPatient, 300)

  const filteredPatients = useMemo(() =>
    mockPatients.filter(
      (p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.medicalRecordNumber.includes(debouncedSearch)
    ),
    [debouncedSearch]
  )

  const selectedPkg = mockPackages.find((p) => p.id === selectedPackage)
  const selectedPt = mockPatients.find((p) => p.id === selectedPatient)

  function handleRegister() {
    setErrors({})
    const result = createCheckupRegistrationSchema.safeParse({
      patientId: selectedPatient,
      mcuPackageId: selectedPackage,
      scheduledDate,
      notes,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => { fieldErrors[err.path[0] as string] = err.message })
      setErrors(fieldErrors)
      return
    }
    toast.success("Pendaftaran MCU berhasil", {
      description: `Pasien ${selectedPt?.name} — ${selectedPkg?.name}`,
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">1</span>
              Pilih Pasien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pasien (nama / No. RM / NIK)..."
                className="pl-8"
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>No. RM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((p) => (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer ${selectedPatient === p.id ? "bg-primary/5" : ""}`}
                      onClick={() => { setSelectedPatient(p.id); setErrors((e) => ({ ...e, patientId: "" })) }}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          name="patient"
                          checked={selectedPatient === p.id}
                          onChange={() => { setSelectedPatient(p.id); setErrors((e) => ({ ...e, patientId: "" })) }}
                          className="accent-primary"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.medicalRecordNumber}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.nik || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {errors.patientId && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.patientId}</p>}
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Pasien Baru
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">2</span>
              Pilih Paket MCU
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {mockPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedPackage === pkg.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => { setSelectedPackage(pkg.id); setErrors((e) => ({ ...e, mcuPackageId: "" })) }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="package"
                      checked={selectedPackage === pkg.id}
                      onChange={() => { setSelectedPackage(pkg.id); setErrors((e) => ({ ...e, mcuPackageId: "" })) }}
                      className="mt-1 accent-primary"
                    />
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pkg.examinations.map((e) => (
                          <Badge key={e.id} variant="secondary" className="text-xs">{e.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatCurrency(pkg.price)}</p>
                </div>
              ))}
            </div>
            {errors.mcuPackageId && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.mcuPackageId}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">3</span>
              Jadwal & Catatan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Pemeriksaan</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Jam</Label>
                <Input type="time" defaultValue="08:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input placeholder="Catatan tambahan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPt ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {selectedPt.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedPt.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPt.medicalRecordNumber}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pasien dipilih</p>
            )}

            {selectedPkg ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPkg.name}</span>
                </div>
                <Separator />
                <div className="space-y-1">
                  {selectedPkg.examinations.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{e.name}</span>
                      <span className="text-xs text-muted-foreground">{e.category}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedPkg.price)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada paket dipilih</p>
            )}

            <Button className="w-full" disabled={!selectedPatient || !selectedPackage} onClick={handleRegister}>
              Daftarkan MCU
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
