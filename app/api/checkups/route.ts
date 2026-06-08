import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createCheckupRegistrationSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"
import type { ExamCategory } from "@/types"

function getStationsForPackage(exams: { category: ExamCategory }[]): ExamCategory[] {
  const stations = new Set<ExamCategory>()
  for (const exam of exams) {
    stations.add(exam.category)
  }
  return Array.from(stations)
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const date = searchParams.get("date")
    const status = searchParams.get("status")
    const patientId = searchParams.get("patientId")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.scheduledDate = { gte: start, lte: end }
    }
    if (status) where.status = status
    if (patientId) where.patientId = patientId

    const [checkups, total] = await Promise.all([
      prisma.checkupRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: true,
          mcuPackage: { include: { examinations: { include: { examinationType: true } } } },
          registeredBy: { select: { id: true, name: true, email: true, role: true } },
          report: true,
          billing: true,
          queue: true,
        },
      }),
      prisma.checkupRegistration.count({ where }),
    ])

    return NextResponse.json({
      data: checkups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST"])
    if (roleError) return roleError

    const body = await req.json()
    const parsed = createCheckupRegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { patientId, mcuPackageId, scheduledDate, notes } = parsed.data

    const mcuPackage = await prisma.mcuPackage.findUnique({
      where: { id: mcuPackageId },
      include: { examinations: { include: { examinationType: true } } },
    })
    if (!mcuPackage || !mcuPackage.isActive) {
      return NextResponse.json({ error: "Paket MCU tidak ditemukan atau tidak aktif" }, { status: 404 })
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 })
    }

    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    const countToday = await prisma.checkupRegistration.count({
      where: { registrationNumber: { startsWith: `MCU-${dateStr}` } },
    })
    const registrationNumber = `MCU-${dateStr}-${String(countToday + 1).padStart(4, "0")}`

    const stations = getStationsForPackage(mcuPackage.examinations.map((e) => e.examinationType))

    const result = await prisma.$transaction(async (tx) => {
      const checkup = await tx.checkupRegistration.create({
        data: {
          registrationNumber,
          patientId,
          mcuPackageId,
          registeredById: user!.id,
          scheduledDate: new Date(scheduledDate),
          notes: notes || null,
        },
      })

      const billing = await tx.billing.create({
        data: {
          checkupId: checkup.id,
          totalAmount: mcuPackage.price,
          finalAmount: mcuPackage.price,
          handledById: user!.id,
        },
      })

      const queueData = await Promise.all(
        stations.map(async (station) => {
          const lastQueue = await tx.queueEntry.findFirst({
            where: { station, createdAt: { gte: new Date(today.toISOString().slice(0, 10)) } },
            orderBy: { queueNumber: "desc" },
          })
          return tx.queueEntry.create({
            data: {
              checkupId: checkup.id,
              station,
              queueNumber: (lastQueue?.queueNumber ?? 0) + 1,
            },
          })
        })
      )

      return { checkup, billing, queue: queueData }
    })

    await createAuditLog({
      userId: user!.id,
      action: "CREATE",
      entity: "CheckupRegistration",
      entityId: result.checkup.id,
      newValue: { registrationNumber, patientId, mcuPackageId },
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
