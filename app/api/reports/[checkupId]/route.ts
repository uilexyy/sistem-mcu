import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { checkupId: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR"])
    if (roleError) return roleError

    const report = await prisma.checkupReport.findUnique({
      where: { checkupId: params.checkupId },
      include: {
        reviewedBy: { select: { id: true, name: true } },
        checkup: {
          include: {
            patient: true,
            mcuPackage: true,
            results: { include: { examinationType: true } },
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: report })
  } catch (error) {
    return errorResponse(error)
  }
}
