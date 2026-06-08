import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"
import { createPatientSchema } from "@/lib/validations"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        checkups: {
          orderBy: { createdAt: "desc" },
          include: {
            mcuPackage: true,
            results: { include: { examinationType: true } },
            report: true,
            billing: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: patient })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST"])
    if (roleError) return roleError

    const existing = await prisma.patient.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createPatientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, dateOfBirth, gender, phone, email, address, bloodType, nik } = parsed.data

    if (nik && nik !== existing.nik) {
      const duplicate = await prisma.patient.findUnique({ where: { nik } })
      if (duplicate) {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 })
      }
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
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
      action: "UPDATE",
      entity: "Patient",
      entityId: patient.id,
      oldValue: { name: existing.name, nik: existing.nik },
      newValue: { name, nik },
    })

    return NextResponse.json({ data: patient })
  } catch (error) {
    return errorResponse(error)
  }
}
