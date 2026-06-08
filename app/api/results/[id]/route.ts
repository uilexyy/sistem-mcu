import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createAuditLog } from "@/lib/audit"
import { autoFlagStatus } from "@/lib/auto-flag"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const existing = await prisma.checkupResult.findUnique({
      where: { id: params.id },
      include: { examinationType: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Hasil pemeriksaan tidak ditemukan" }, { status: 404 })
    }

    if (existing.examinedById !== user!.id && user!.role !== "ADMIN") {
      return NextResponse.json({ error: "Anda hanya bisa mengubah hasil sendiri" }, { status: 403 })
    }

    const body = await req.json()
    const valueNumeric = body.valueNumeric ?? existing.valueNumeric
    const valueText = body.valueText ?? existing.valueText
    const notes = body.notes ?? existing.notes

    const status = existing.examinationType.isQuantitative
      ? autoFlagStatus(valueNumeric, existing.examinationType.normalRangeMin, existing.examinationType.normalRangeMax)
      : existing.status

    const updated = await prisma.checkupResult.update({
      where: { id: params.id },
      data: {
        valueNumeric,
        valueText,
        notes,
        status,
      },
      include: { examinationType: true },
    })

    await createAuditLog({
      userId: user!.id,
      action: "UPDATE",
      entity: "CheckupResult",
      entityId: params.id,
      oldValue: { valueNumeric: existing.valueNumeric, valueText: existing.valueText, status: existing.status },
      newValue: { valueNumeric, valueText, status },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN"])
    if (roleError) return roleError

    const existing = await prisma.checkupResult.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Hasil pemeriksaan tidak ditemukan" }, { status: 404 })
    }

    await prisma.checkupResult.delete({ where: { id: params.id } })

    await createAuditLog({
      userId: user!.id,
      action: "DELETE",
      entity: "CheckupResult",
      entityId: params.id,
      oldValue: { checkupId: existing.checkupId, examinationTypeId: existing.examinationTypeId },
    })

    return NextResponse.json({ message: "Hasil pemeriksaan berhasil dihapus" })
  } catch (error) {
    return errorResponse(error)
  }
}
