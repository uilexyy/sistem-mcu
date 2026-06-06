"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Download, Eye, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { mockCheckups } from "@/lib/data"
import { formatDate } from "@/lib/utils"
import type { FitnessStatus } from "@/types"

const fitnessConfig: Record<FitnessStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  FIT: { label: "Sehat", icon: CheckCircle2, color: "text-green-500" },
  FIT_WITH_NOTES: { label: "Sehat dengan Catatan", icon: AlertCircle, color: "text-yellow-500" },
  UNFIT: { label: "Tidak Sehat", icon: XCircle, color: "text-red-500" },
}

export default function ReportsPage() {
  const [selectedCheckupId, setSelectedCheckupId] = useState<string | null>(null)
  const [fitness, setFitness] = useState<FitnessStatus>("FIT")

  const completed = mockCheckups.filter((c) => c.status === "COMPLETED" || c.status === "IN_PROGRESS")
  const selected = completed.find((c) => c.id === selectedCheckupId)

  function handleCreateReport() {
    if (!selected) return
    toast.success("Laporan MCU berhasil dibuat", {
      description: `${selected.patient.name} — ${fitnessConfig[fitness].label}`,
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Pasien Selesai</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {completed.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                  selectedCheckupId === c.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
                onClick={() => setSelectedCheckupId(c.id)}
              >
                <p className="font-medium text-sm">{c.patient.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.scheduledDate)}</p>
                {c.report?.fitnessStatus && (
                  <Badge variant="outline" className="mt-1 text-xs">{fitnessConfig[c.report.fitnessStatus].label}</Badge>
                )}
              </button>
            ))}
            {completed.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">Belum ada pasien</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-6">
        {selected ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.patient.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selected.registrationNumber}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">{selected.mcuPackage.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-medium mb-3">Hasil Pemeriksaan</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pemeriksaan</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Hasil</TableHead>
                      <TableHead>Normal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.mcuPackage.examinations.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell className="capitalize">{exam.category.toLowerCase()}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {exam.isQuantitative && exam.normalRangeMin !== null
                            ? `${exam.normalRangeMin} - ${exam.normalRangeMax} ${exam.unit || ""}`
                            : "Kualitatif"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Belum diinput</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kesimpulan Dokter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kesimpulan</Label>
                  <Input placeholder="Kesimpulan hasil pemeriksaan..." />
                </div>
                <div className="space-y-2">
                  <Label>Rekomendasi</Label>
                  <Input placeholder="Rekomendasi untuk pasien..." />
                </div>
                <div className="space-y-2">
                  <Label>Status Kebugaran</Label>
                  <Select value={fitness} onValueChange={(v) => setFitness(v as FitnessStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(fitnessConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button><FileText className="mr-2 h-4 w-4" /> Buat Laporan</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Buat Laporan MCU</AlertDialogTitle>
                        <AlertDialogDescription>Laporan akan diterbitkan dengan status <strong>{fitnessConfig[fitness].label}</strong> untuk {selected.patient.name}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateReport}>Ya, Buat Laporan</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" disabled><Eye className="mr-2 h-4 w-4" /> Preview PDF</Button>
                  <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Pilih pasien untuk buat laporan</p>
          </div>
        )}
      </div>
    </div>
  )
}
