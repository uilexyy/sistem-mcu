import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requireRole, errorResponse } from "@/lib/api-helpers"

export async function GET() {
  try {
    const user = await getSessionUser()
    const roleError = requireRole(user, ["ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER"])
    if (roleError) return roleError

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalPatientsToday,
      inProgress,
      completed,
      totalRevenue,
      weeklyData,
    ] = await Promise.all([
      prisma.checkupRegistration.count({
        where: { scheduledDate: { gte: today, lt: tomorrow } },
      }),
      prisma.checkupRegistration.count({
        where: {
          scheduledDate: { gte: today, lt: tomorrow },
          status: "IN_PROGRESS",
        },
      }),
      prisma.checkupRegistration.count({
        where: {
          scheduledDate: { gte: today, lt: tomorrow },
          status: "COMPLETED",
        },
      }),
      prisma.billing.aggregate({
        where: {
          paymentStatus: "PAID",
          paidAt: { gte: today, lt: tomorrow },
        },
        _sum: { finalAmount: true },
      }),
      prisma.$queryRaw`
        SELECT DATE("scheduledDate") as date, COUNT(*) as count
        FROM "CheckupRegistration"
        WHERE "scheduledDate" >= ${new Date(today.getTime() - 7 * 86400000)}
          AND "scheduledDate" < ${tomorrow}
        GROUP BY DATE("scheduledDate")
        ORDER BY date ASC
      `,
    ])

    return NextResponse.json({
      data: {
        totalPatientsToday,
        inProgress,
        completed,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
        weeklyData,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
