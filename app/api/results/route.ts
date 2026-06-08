import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createCheckupResultSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"
import { autoFlagStatus } from "@/lib/auto-flag"

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const checkupId = searchParams.get("checkupId")

    if (!checkupId) {
      return NextResponse.json({ error: "Parameter checkupId diperlukan" }, { status: 400 })
    }

    const results = await prisma.checkupResult.findMany({
      where: { checkupId },
      include: {
        examinationType: true,
        examinedBy: { select: { id: true, name: true } },
      },
      orderBy: { examinedAt: "asc" },
    })

    return NextResponse.json({ data: results })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const body = await req.json()
    const parsed = createCheckupResultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { checkupId, examinationTypeId, valueNumeric, valueText, notes } = parsed.data

    const examType = await prisma.examinationType.findUnique({ where: { id: examinationTypeId } })
    if (!examType) {
      return NextResponse.json({ error: "Jenis pemeriksaan tidak ditemukan" }, { status: 404 })
    }

    const existing = await prisma.checkupResult.findUnique({
      where: { checkupId_examinationTypeId: { checkupId, examinationTypeId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Hasil pemeriksaan sudah ada, gunakan endpoint UPDATE" }, { status: 409 })
    }

    const status = examType.isQuantitative
      ? autoFlagStatus(valueNumeric ?? null, examType.normalRangeMin, examType.normalRangeMax)
      : "NORMAL"

    const result = await prisma.checkupResult.create({
      data: {
        checkupId,
        examinationTypeId,
        valueNumeric: valueNumeric ?? null,
        valueText: valueText ?? null,
        status,
        notes: notes ?? null,
        examinedById: user!.id,
      },
      include: { examinationType: true },
    })

    await createAuditLog({
      userId: user!.id,
      action: "CREATE",
      entity: "CheckupResult",
      entityId: result.id,
      newValue: { checkupId, examinationTypeId, valueNumeric, valueText, status },
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
