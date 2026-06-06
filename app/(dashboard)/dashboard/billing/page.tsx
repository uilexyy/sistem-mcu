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
import { Separator } from "@/components/ui/separator"
import { Printer, CheckCircle2, Search } from "lucide-react"
import { mockCheckups } from "@/lib/data"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function BillingPage() {
  const [search, setSearch] = useState("")
  const [selectedCheckupId, setSelectedCheckupId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")

  const unpaid = mockCheckups.filter(
    (c) => (c.status === "COMPLETED" || c.status === "IN_PROGRESS") &&
      (!c.billing || c.billing.paymentStatus === "UNPAID")
  )

  const filtered = unpaid.filter(
    (c) =>
      c.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      c.registrationNumber.includes(search)
  )

  const selected = mockCheckups.find((c) => c.id === selectedCheckupId)
  const billing = selected?.billing

  function handleConfirmPayment() {
    if (!paymentMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu")
      return
    }
    toast.success("Pembayaran berhasil dikonfirmasi", {
      description: `${selected?.patient.name} — ${formatCurrency(billing?.finalAmount || selected?.mcuPackage.price || 0)}`,
    })
  }

  function handlePrintReceipt() {
    toast.info("Fitur cetak kwitansi menyusul")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Tagihan Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pasien..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors ${
                  selectedCheckupId === c.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
                onClick={() => { setSelectedCheckupId(c.id); setPaymentMethod("") }}
              >
                <p className="font-medium">{c.patient.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.registrationNumber}</p>
                <p className="text-xs font-semibold text-primary mt-1">
                  {c.billing ? formatCurrency(c.billing.finalAmount) : formatCurrency(c.mcuPackage.price)}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">Semua tagihan lunas</p>
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
                    <p className="text-sm text-muted-foreground font-mono">{selected.registrationNumber}</p>
                  </div>
                  <Badge variant={billing?.paymentStatus === "PAID" ? "success" : "warning"}>
                    {billing?.paymentStatus === "PAID" ? "Lunas" : "Belum Dibayar"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paket MCU</span>
                    <span>{selected.mcuPackage.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span>{formatDate(selected.scheduledDate)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Biaya Paket</span>
                    <span>{formatCurrency(selected.mcuPackage.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Diskon</span>
                    <span className="text-red-500">- {formatCurrency(billing?.discountAmount || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(billing?.finalAmount || selected.mcuPackage.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Tunai</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="BPJS">BPJS</SelectItem>
                        <SelectItem value="INSURANCE">Asuransi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Provider Asuransi</Label>
                    <Input placeholder="Nama asuransi (opsional)" disabled />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={!paymentMethod}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Konfirmasi Pembayaran
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                        <AlertDialogDescription>
                          Pembayaran sebesar {formatCurrency(billing?.finalAmount || selected.mcuPackage.price)} dari {selected.patient.name} akan dicatat.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmPayment}>Ya, Konfirmasi</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" onClick={handlePrintReceipt}>
                    <Printer className="mr-2 h-4 w-4" /> Cetak Kwitansi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Pilih pasien dari daftar tagihan</p>
          </div>
        )}
      </div>
    </div>
  )
}
