"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Power, UserCog } from "lucide-react"
import { mockPackages, mockExaminationTypes } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"

const mockUsers = [
  { id: "u1", name: "Dr. Ahmad", email: "dokter@rs.com", role: "DOCTOR", isActive: true },
  { id: "u2", name: "Suster Dewi", email: "perawat@rs.com", role: "NURSE", isActive: true },
  { id: "u3", name: "Rina Kasir", email: "kasir@rs.com", role: "CASHIER", isActive: true },
  { id: "u4", name: "Budi Receptionist", email: "resepsionis@rs.com", role: "RECEPTIONIST", isActive: true },
  { id: "u5", name: "Ahmad Admin", email: "admin@rs.com", role: "ADMIN", isActive: true },
]

export default function SettingsPage() {
  return (
    <Tabs defaultValue="packages" className="space-y-4">
      <TabsList>
        <TabsTrigger value="packages">Paket MCU</TabsTrigger>
        <TabsTrigger value="examinations">Jenis Pemeriksaan</TabsTrigger>
        <TabsTrigger value="users">Pengguna</TabsTrigger>
      </TabsList>

      <TabsContent value="packages">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Paket MCU</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Paket
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Paket</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Pemeriksaan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{pkg.description}</TableCell>
                    <TableCell>{pkg.examinations.length} item</TableCell>
                    <TableCell>{formatCurrency(pkg.price)}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? "success" : "secondary"}>
                        {pkg.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Power className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="examinations">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Jenis Pemeriksaan</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pemeriksaan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Rentang Normal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExaminationTypes.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell className="capitalize">{exam.category.toLowerCase()}</TableCell>
                    <TableCell>{exam.unit || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {exam.isQuantitative && exam.normalRangeMin !== null
                        ? `${exam.normalRangeMin} - ${exam.normalRangeMax}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.isQuantitative ? "Kuantitatif" : "Kualitatif"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pengguna Sistem</CardTitle>
            <Button size="sm">
              <UserCog className="mr-2 h-4 w-4" /> Tambah Pengguna
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "secondary"}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Power className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
