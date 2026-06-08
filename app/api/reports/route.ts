import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createReportSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR"])
    if (roleError) return roleError

    const body = await req.json()
    const parsed = createReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { checkupId, doctorConclusion, recommendation, fitnessStatus } = parsed.data

    const checkup = await prisma.checkupRegistration.findUnique({
      where: { id: checkupId },
      include: { report: true },
    })
    if (!checkup) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 })
    }
    if (checkup.report) {
      return NextResponse.json({ error: "Laporan sudah ada, gunakan endpoint UPDATE" }, { status: 409 })
    }

    const report = await prisma.checkupReport.create({
      data: {
        checkupId,
        doctorConclusion: doctorConclusion || null,
        recommendation: recommendation || null,
        fitnessStatus,
        reviewedById: user!.id,
        issuedAt: new Date(),
      },
      include: {
        reviewedBy: { select: { id: true, name: true } },
        checkup: { include: { patient: true } },
      },
    })

    await prisma.checkupRegistration.update({
      where: { id: checkupId },
      data: { status: "COMPLETED" },
    })

    await createAuditLog({
      userId: user!.id,
      action: "CREATE",
      entity: "CheckupReport",
      entityId: report.id,
      newValue: { checkupId, fitnessStatus },
    })

    return NextResponse.json({ data: report }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
