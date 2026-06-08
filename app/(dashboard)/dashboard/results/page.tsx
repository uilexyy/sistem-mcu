"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Upload, Save, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { mockCheckups } from "@/lib/data"
import { autoFlagStatus } from "@/lib/auto-flag"
import type { ExamCategory, CheckupRegistration, Role } from "@/types"

const roleCategoryMap: Record<Role, ExamCategory[]> = {
  ADMIN: ["LAB", "RADIOLOGY", "PHYSICAL", "SPECIALIST"],
  DOCTOR: ["LAB", "RADIOLOGY", "PHYSICAL", "SPECIALIST"],
  NURSE: ["LAB", "PHYSICAL"],
  LAB: ["LAB"],
  RADIOLOGY: ["RADIOLOGY"],
  RECEPTIONIST: [],
  CASHIER: [],
}

const allCategoryTabs: { value: ExamCategory; label: string }[] = [
  { value: "LAB", label: "Laboratorium" },
  { value: "RADIOLOGY", label: "Radiologi" },
  { value: "PHYSICAL", label: "Fisik" },
  { value: "SPECIALIST", label: "Spesialis" },
]

function getResultDisplay(value: number, min: number | null, max: number | null): { status: string; icon: React.ElementType; color: string; text: string } {
  const status = autoFlagStatus(value, min, max)
  if (status === "ABNORMAL") return { status, icon: AlertCircle, color: "text-red-500 border-red-500", text: "Nilai di luar batas normal" }
  if (status === "BORDERLINE") return { status, icon: AlertTriangle, color: "text-yellow-500 border-yellow-500", text: "Nilai borderline / batas normal" }
  return { status, icon: CheckCircle2, color: "text-green-500", text: "Normal" }
}

function ResultForm({ checkup, categoryTabs }: { checkup: CheckupRegistration; categoryTabs: { value: ExamCategory; label: string }[] }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState<ExamCategory>(categoryTabs[0]?.value || "LAB")

  const examsByCategory = (cat: ExamCategory) =>
    checkup.mcuPackage.examinations.filter((e) => e.category === cat)

  function handleSave() {
    const filled = Object.keys(values).filter((k) => values[k])
    if (filled.length === 0) {
      toast.error("Belum ada hasil diinput")
      return
    }
    toast.success("Semua hasil berhasil disimpan")
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ExamCategory)}>
        <TabsList>
          {categoryTabs.map((t) => {
            const count = examsByCategory(t.value).length
            if (count === 0) return null
            return <TabsTrigger key={t.value} value={t.value}>{t.label} ({count})</TabsTrigger>
          })}
        </TabsList>
        {categoryTabs.map((t) => {
          const exams = examsByCategory(t.value)
          if (exams.length === 0) return null
          return (
            <TabsContent key={t.value} value={t.value}>
              <div className="space-y-4">
                  {exams.map((exam) => {
                  const val = parseFloat(values[exam.id] || "")
                  const result = !isNaN(val) && exam.isQuantitative && val > 0 ? getResultDisplay(val, exam.normalRangeMin, exam.normalRangeMax) : null
                  const isBorderline = result?.status === "BORDERLINE"
                  const isAbnormal = result?.status === "ABNORMAL"
                  return (
                    <div key={exam.id} className="flex items-end gap-4 p-4 rounded-lg border">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label>{exam.name}</Label>
                          {exam.unit && <span className="text-xs text-muted-foreground">({exam.unit})</span>}
                        </div>
                        {exam.normalRangeMin !== null && exam.normalRangeMax !== null && (
                          <p className="text-xs text-muted-foreground">
                            Normal: {exam.normalRangeMin} - {exam.normalRangeMax} {exam.unit}
                          </p>
                        )}
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <Input
                            placeholder={exam.isQuantitative ? "Nilai" : "Hasil"}
                            value={values[exam.id] || ""}
                            onChange={(e) => setValues((v) => ({ ...v, [exam.id]: e.target.value }))}
                            className={isAbnormal ? "border-red-500 focus-visible:ring-red-500" : isBorderline ? "border-yellow-500 focus-visible:ring-yellow-500" : ""}
                          />
                          {result && <result.icon className={`absolute right-2 top-2.5 h-4 w-4 ${result.color}`} />}
                        </div>
                        {result && <p className={`text-xs mt-1 flex items-center gap-1 ${result.color}`}><result.icon className="h-3 w-3" /> {result.text}</p>}
                      </div>
                      {!exam.isQuantitative && (
                        <Button variant="outline" size="sm" onClick={() => toast.info("Fitur upload menyusul")}>
                          <Upload className="h-3 w-3 mr-1" /> Upload
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => toast.info("Draf disimpan")}>Simpan Draf</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Simpan Semua Hasil
            </Button>
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Hasil Pemeriksaan?</AlertDialogTitle>
            <AlertDialogDescription>Hasil yang abnormal akan ditandai otomatis. Pastikan semua data sudah benar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ResultsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role as Role || "ADMIN"
  const allowedCategories = roleCategoryMap[role]
  const categoryTabs = allCategoryTabs.filter((t) => allowedCategories.includes(t.value))
  const [selectedCheckupId, setSelectedCheckupId] = useState<string | null>(null)
  const inProgress = mockCheckups.filter((c) => c.status === "IN_PROGRESS" || c.status === "REGISTERED")
  const selectedCheckup = inProgress.find((c) => c.id === selectedCheckupId)

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pasien</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {inProgress.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                  selectedCheckupId === c.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
                onClick={() => setSelectedCheckupId(c.id)}
              >
                <p className="font-medium text-sm">{c.patient.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.registrationNumber}</p>
                <Badge variant="outline" className="mt-1 text-xs">{c.mcuPackage.name}</Badge>
              </button>
            ))}
            {inProgress.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada pasien</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        {selectedCheckup ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedCheckup.patient.name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{selectedCheckup.registrationNumber}</p>
                </div>
                <Badge variant="info" className="text-sm px-3 py-1">
                  {selectedCheckup.mcuPackage.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResultForm checkup={selectedCheckup} categoryTabs={categoryTabs} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Pilih pasien dari daftar untuk input hasil</p>
          </div>
        )}
      </div>
    </div>
  )
}
