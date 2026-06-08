import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createAuditLog } from "@/lib/audit"

const validTransitions: Record<string, string[]> = {
  REGISTERED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"])
    if (roleError) return roleError

    const checkup = await prisma.checkupRegistration.findUnique({ where: { id: params.id } })
    if (!checkup) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 })
    }

    const { status } = await req.json()
    const allowedNext = validTransitions[checkup.status]
    if (!allowedNext || !allowedNext.includes(status)) {
      return NextResponse.json({
        error: `Status ${checkup.status} tidak bisa diubah ke ${status}. Hanya: ${allowedNext?.join(", ") || "tidak ada transisi yang valid"}`,
      }, { status: 400 })
    }

    const updated = await prisma.checkupRegistration.update({
      where: { id: params.id },
      data: { status },
    })

    await createAuditLog({
      userId: user!.id,
      action: "UPDATE",
      entity: "CheckupRegistration",
      entityId: params.id,
      oldValue: { status: checkup.status },
      newValue: { status },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
