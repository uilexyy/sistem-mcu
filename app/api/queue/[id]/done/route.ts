import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "LAB", "RADIOLOGY", "DOCTOR", "NURSE"])
    if (roleError) return roleError

    const entry = await prisma.queueEntry.findUnique({ where: { id: params.id } })
    if (!entry) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }
    if (entry.status === "DONE") {
      return NextResponse.json({ error: "Antrian sudah selesai" }, { status: 400 })
    }

    const updated = await prisma.queueEntry.update({
      where: { id: params.id },
      data: { status: "DONE", doneAt: new Date() },
    })

    const otherPending = await prisma.queueEntry.count({
      where: {
        checkupId: entry.checkupId,
        status: { notIn: ["DONE", "SKIPPED"] },
      },
    })

    if (otherPending === 0) {
      await prisma.checkupRegistration.update({
        where: { id: entry.checkupId },
        data: { status: "COMPLETED" },
      })
    }

    await createAuditLog({
      userId: user!.id,
      action: "UPDATE",
      entity: "QueueEntry",
      entityId: params.id,
      oldValue: { status: entry.status },
      newValue: { status: "DONE" },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
