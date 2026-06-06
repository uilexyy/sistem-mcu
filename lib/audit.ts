import { prisma } from "@/lib/prisma"

export async function createAuditLog(params: {
  userId: string
  action: "CREATE" | "UPDATE" | "DELETE" | "PRINT"
  entity: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.ipAddress,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}
