import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "LAB", "RADIOLOGY"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] })
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { nik: { contains: q } },
          { medicalRecordNumber: { contains: q, mode: "insensitive" as const } },
        ],
      },
      select: {
        id: true,
        medicalRecordNumber: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        nik: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: patients })
  } catch (error) {
    return errorResponse(error)
  }
}
