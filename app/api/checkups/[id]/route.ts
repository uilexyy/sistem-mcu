import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const checkup = await prisma.checkupRegistration.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        mcuPackage: { include: { examinations: { include: { examinationType: true } } } },
        registeredBy: { select: { id: true, name: true, email: true, role: true } },
        results: { include: { examinationType: true, examinedBy: { select: { id: true, name: true } } } },
        report: { include: { reviewedBy: { select: { id: true, name: true } } } },
        billing: { include: { handledBy: { select: { id: true, name: true } } } },
        queue: { include: { checkup: { select: { patient: { select: { name: true } } } } } },
      },
    })

    if (!checkup) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: checkup })
  } catch (error) {
    return errorResponse(error)
  }
}
