import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createPatientSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { nik: { contains: search, mode: "insensitive" as const } },
            { medicalRecordNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ])

    return NextResponse.json({
      data: patients,
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
    const parsed = createPatientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, dateOfBirth, gender, phone, email, address, bloodType, nik } = parsed.data

    if (nik) {
      const existing = await prisma.patient.findUnique({ where: { nik } })
      if (existing) {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 })
      }
    }

    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
    const countToday = await prisma.patient.count({
      where: { medicalRecordNumber: { startsWith: `RM-${dateStr}` } },
    })
    const medicalRecordNumber = `RM-${dateStr}-${String(countToday + 1).padStart(4, "0")}`

    const patient = await prisma.patient.create({
      data: {
        medicalRecordNumber,
        name,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone: phone || null,
        email: email || null,
        address: address || null,
        bloodType: bloodType || null,
        nik: nik || null,
      },
    })

    await createAuditLog({
      userId: user!.id,
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
      newValue: { medicalRecordNumber, name },
    })

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
