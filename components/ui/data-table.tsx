"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, pageSize = 10, emptyMessage = "Tidak ada data" }: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(data.length / pageSize)

  const pageData = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize]
  )

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">{emptyMessage}</div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((row, i) => (
            <TableRow key={(row as Record<string, unknown>).id as string || i}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>{col.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
          <p>
            Menampilkan {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)} dari {data.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
