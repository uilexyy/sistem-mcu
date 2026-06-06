"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, CheckCircle2, SkipForward, Clock, User } from "lucide-react"
import { mockQueue } from "@/lib/data"
import type { ExamCategory } from "@/types"

const stationTabs: { value: ExamCategory; label: string }[] = [
  { value: "LAB", label: "Laboratorium" },
  { value: "RADIOLOGY", label: "Radiologi" },
  { value: "PHYSICAL", label: "Fisik" },
  { value: "SPECIALIST", label: "Spesialis" },
]

const statusBadge: Record<string, "info" | "warning" | "success" | "secondary" | "destructive"> = {
  WAITING: "info",
  CALLED: "warning",
  IN_EXAMINATION: "warning",
  DONE: "success",
  SKIPPED: "destructive",
}

const statusLabel: Record<string, string> = {
  WAITING: "Menunggu", CALLED: "Dipanggil", IN_EXAMINATION: "Diperiksa", DONE: "Selesai", SKIPPED: "Dilewati",
}

export default function CheckupPage() {
  const [station, setStation] = useState<ExamCategory>("LAB")

  const stationQueue = mockQueue.filter((q) => q.station === station)
  const waiting = stationQueue.filter((q) => q.status === "WAITING")
  const current = stationQueue.find((q) => q.status === "IN_EXAMINATION")

  function handleCall(patientName: string) {
    toast.success(`Memanggil ${patientName}`, { description: "Silakan menuju stasiun pemeriksaan" })
  }

  function handleDone(patientName: string) {
    toast.success(`${patientName} selesai diperiksa`)
  }

  function handleSkip(patientName: string) {
    toast.warning(`${patientName} dilewati`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stationTabs.map((s) => {
          const count = mockQueue.filter((q) => q.station === s.value && q.status === "WAITING").length
          return (
            <Card
              key={s.value}
              className={`cursor-pointer transition-colors ${station === s.value ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50"}`}
              onClick={() => setStation(s.value)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">menunggu</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Antrian {stationTabs.find((s) => s.value === station)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stationQueue.map((q) => (
                  <TableRow key={q.id} className={q.status === "IN_EXAMINATION" ? "bg-primary/5" : ""}>
                    <TableCell className="text-lg font-bold">{q.queueNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {q.patient.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{q.patient.name}</p>
                          <p className="text-xs text-muted-foreground">{q.patient.medicalRecordNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[q.status]}>{statusLabel[q.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {q.status === "WAITING" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleCall(q.patient.name)}>
                              <Phone className="h-3 w-3 mr-1" /> Panggil
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSkip(q.patient.name)}>
                              <SkipForward className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {q.status === "IN_EXAMINATION" && (
                          <Button size="sm" variant="default" onClick={() => handleDone(q.patient.name)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Selesai
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stationQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Tidak ada antrian
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sedang Diperiksa</CardTitle>
          </CardHeader>
          <CardContent>
            {current ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg">{current.patient.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{current.patient.medicalRecordNumber}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Mulai: 08:30</span>
                </div>
                <Button className="w-full" onClick={() => handleDone(current.patient.name)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Selesai Periksa
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Tidak ada pasien sedang diperiksa</p>
                <p className="text-sm mt-1">{waiting.length} pasien menunggu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
