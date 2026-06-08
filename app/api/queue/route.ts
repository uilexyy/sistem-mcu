import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "RECEPTIONIST", "LAB", "RADIOLOGY", "DOCTOR", "NURSE"])
    if (roleError) return roleError

    const { searchParams } = new URL(req.url)
    const station = searchParams.get("station") as string | null
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)

    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const validStations = ["LAB", "RADIOLOGY", "PHYSICAL", "SPECIALIST"]
    const where: Record<string, unknown> = {
      createdAt: { gte: start, lte: end },
    }
    if (station && validStations.includes(station)) {
      where.station = station
    }

    const queue = await prisma.queueEntry.findMany({
      where,
      orderBy: [{ status: "desc" }, { queueNumber: "asc" }],
      include: {
        checkup: {
          include: {
            patient: { select: { id: true, name: true, medicalRecordNumber: true, gender: true } },
            mcuPackage: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: queue })
  } catch (error) {
    return errorResponse(error)
  }
}
