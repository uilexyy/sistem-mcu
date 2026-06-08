import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createAuditLog } from "@/lib/audit"

const validTransitions: Record<string, string[]> = {
  UNPAID: ["PAID", "REFUNDED"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "CASHIER"])
    if (roleError) return roleError

    const billing = await prisma.billing.findUnique({ where: { id: params.id } })
    if (!billing) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    const { paymentStatus, paymentMethod, insuranceProvider } = await req.json()

    if (paymentStatus) {
      const allowedNext = validTransitions[billing.paymentStatus]
      if (!allowedNext || !allowedNext.includes(paymentStatus)) {
        return NextResponse.json({
          error: `Status ${billing.paymentStatus} tidak bisa diubah ke ${paymentStatus}. Hanya: ${allowedNext?.join(", ") || "tidak ada transisi valid"}`,
        }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = {}
    if (paymentStatus) data.paymentStatus = paymentStatus
    if (paymentMethod) data.paymentMethod = paymentMethod
    if (insuranceProvider !== undefined) data.insuranceProvider = insuranceProvider
    if (paymentStatus === "PAID" && billing.paymentStatus !== "PAID") {
      data.paidAt = new Date()
      data.receiptNumber = `INV-${Date.now()}`
      data.handledById = user!.id
    }

    const updated = await prisma.billing.update({
      where: { id: params.id },
      data,
    })

    await createAuditLog({
      userId: user!.id,
      action: "UPDATE",
      entity: "Billing",
      entityId: params.id,
      oldValue: { paymentStatus: billing.paymentStatus },
      newValue: { paymentStatus: updated.paymentStatus },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
