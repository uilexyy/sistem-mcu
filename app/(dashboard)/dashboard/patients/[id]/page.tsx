"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Phone, Mail, MapPin, Droplets } from "lucide-react"
import { mockPatients, mockCheckups } from "@/lib/data"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

const statusBadge: Record<string, "info" | "warning" | "success" | "destructive"> = {
  REGISTERED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
}

const statusLabel: Record<string, string> = {
  REGISTERED: "Terdaftar", IN_PROGRESS: "Diproses", COMPLETED: "Selesai", CANCELLED: "Dibatalkan",
}

export default function PatientDetailPage() {
  const params = useParams()
  const patient = mockPatients.find((p) => p.id === params.id)
  const history = mockCheckups.filter((c) => c.patientId === params.id)

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Pasien tidak ditemukan</div>
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/patients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Data Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{patient.medicalRecordNumber}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(patient.dateOfBirth)} ({patient.gender === "MALE" ? "Laki-laki" : "Perempuan"})</span>
              </div>
              {patient.nik && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{patient.nik}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.bloodType && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span>Gol. Darah {patient.bloodType}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Riwayat MCU</CardTitle>
            <Link href="/dashboard/registration">
              <Button size="sm">Daftar MCU Baru</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Registrasi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tagihan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.registrationNumber}</TableCell>
                    <TableCell>{formatDate(c.scheduledDate)}</TableCell>
                    <TableCell>{c.mcuPackage.name}</TableCell>
                    <TableCell><Badge variant={statusBadge[c.status]}>{statusLabel[c.status]}</Badge></TableCell>
                    <TableCell>{c.billing ? formatCurrency(c.billing.finalAmount) : "-"}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Belum ada riwayat MCU
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
