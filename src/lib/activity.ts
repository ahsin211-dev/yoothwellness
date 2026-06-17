import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";

interface LogActivityParams {
  userId: string;
  adminId?: string;
  type: ActivityType;
  description: string;
  // Prisma Json field accepts any JSON-serializable value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        adminId: params.adminId,
        type: params.type,
        description: params.description,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch {
    // Activity logging should never break main flows — fail silently
    console.error("[ActivityLog] Failed to log activity:", params);
  }
}

export async function getPatientActivity(
  patientUserId: string,
  limit = 50
) {
  return prisma.activityLog.findMany({
    where: { userId: patientUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAdminActivity(adminId: string, limit = 50) {
  return prisma.activityLog.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
