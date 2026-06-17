import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  actorId?: string;
  patientId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: params.actorId,
        patientId: params.patientId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  type?: "INFO" | "ALERT" | "MESSAGE" | "ORDER" | "LAB" | "APPOINTMENT";
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type ?? "INFO",
      link: params.link,
    },
  });
}
