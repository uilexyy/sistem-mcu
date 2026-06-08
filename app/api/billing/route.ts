import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createBillingSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "CASHIER", "RECEPTIONIST"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const checkupId = searchParams.get("checkupId")

    if (!checkupId) {
      return NextResponse.json({ error: "Parameter checkupId diperlukan" }, { status: 400 })
    }

    const billing = await prisma.billing.findUnique({
      where: { checkupId },
      include: {
        handledBy: { select: { id: true, name: true } },
        checkup: {
          include: {
            patient: true,
            mcuPackage: true,
          },
        },
      },
    })

    if (!billing) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: billing })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "CASHIER"])
    if (roleError) return roleError

    const body = await req.json()
    const parsed = createBillingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { checkupId, finalAmount, discountAmount, paymentMethod, insuranceProvider } = parsed.data

    const checkup = await prisma.checkupRegistration.findUnique({
      where: { id: checkupId },
      include: { billing: true, mcuPackage: true },
    })
    if (!checkup) {
      return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 })
    }
    if (!checkup.billing) {
      return NextResponse.json({ error: "Tagihan belum dibuat, daftarkan pasien terlebih dahulu" }, { status: 400 })
    }
    if (checkup.billing.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Tagihan sudah dibayar" }, { status: 409 })
    }

    const receiptNumber = `INV-${Date.now()}`

    const billing = await prisma.billing.update({
      where: { checkupId },
      data: {
        finalAmount,
        discountAmount: discountAmount || 0,
        paymentMethod: paymentMethod || null,
        insuranceProvider: insuranceProvider || null,
        paymentStatus: "PAID",
        paidAt: new Date(),
        receiptNumber,
        handledById: user!.id,
      },
    })

    await createAuditLog({
      userId: user!.id,
      action: "UPDATE",
      entity: "Billing",
      entityId: billing.id,
      oldValue: { paymentStatus: checkup.billing.paymentStatus },
      newValue: { paymentStatus: "PAID", receiptNumber },
    })

    return NextResponse.json({ data: billing })
  } catch (error) {
    return errorResponse(error)
  }
}
