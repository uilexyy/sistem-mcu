"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ClipboardCheck, CheckCircle2, DollarSign, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { mockDashboardStats, mockCheckups, mockQueue } from "@/lib/data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

const chartData = [
  { name: "Sen", pasien: 8 },
  { name: "Sel", pasien: 12 },
  { name: "Rab", pasien: 15 },
  { name: "Kam", pasien: 10 },
  { name: "Jum", pasien: 18 },
  { name: "Sab", pasien: 6 },
  { name: "Min", pasien: 0 },
]

const statusBadge: Record<string, "info" | "warning" | "success" | "destructive"> = {
  REGISTERED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
}

const statusLabel: Record<string, string> = {
  REGISTERED: "Terdaftar",
  IN_PROGRESS: "Diproses",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

export default function DashboardPage() {
  const stats = mockDashboardStats
  const todayCheckups = mockCheckups.filter((c) => c.scheduledDate === "2025-06-01")
  const todayQueue = mockQueue.filter((q) => q.status !== "DONE")

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pasien Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatientsToday}</div>
            <p className="text-xs text-muted-foreground">Total pasien terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sedang Diperiksa</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Dalam proses pemeriksaan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Pemeriksaan selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan hari ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pasien Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="pasien" fill="hsl(196, 94%, 38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Antrian MCU Hari Ini</CardTitle>
            <Link href="/dashboard/checkup">
              <Button variant="ghost" size="sm">
                Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Antrian</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Stasiun</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayQueue.slice(0, 5).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.queueNumber}</TableCell>
                    <TableCell>{q.patient.name}</TableCell>
                    <TableCell className="capitalize">{q.station.toLowerCase()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          q.status === "WAITING" ? "info" :
                          q.status === "IN_EXAMINATION" ? "warning" :
                          q.status === "DONE" ? "success" : "secondary"
                        }
                      >
                        {q.status === "WAITING" ? "Menunggu" :
                         q.status === "CALLED" ? "Dipanggil" :
                         q.status === "IN_EXAMINATION" ? "Diperiksa" :
                         q.status === "DONE" ? "Selesai" : "Dilewati"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {todayQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Tidak ada antrian hari ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Registrasi Terbaru</CardTitle>
            <Link href="/dashboard/registration">
              <Button variant="ghost" size="sm">
                Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Registrasi</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayCheckups.slice(0, 5).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.registrationNumber}</TableCell>
                    <TableCell>{c.patient.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[c.status]}>{statusLabel[c.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {todayCheckups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Belum ada registrasi hari ini
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
