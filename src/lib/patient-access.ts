import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";

export async function getPatientProfileForUser(userId: string) {
  return prisma.patientProfile.findUnique({
    where: { userId },
  });
}

export async function getOrCreatePatientProfile(userId: string) {
  const existing = await getPatientProfileForUser(userId);
  if (existing) return existing;
  return prisma.patientProfile.create({ data: { userId } });
}

export async function canAccessPatient(
  userId: string,
  role: Role,
  patientId: string
): Promise<boolean> {
  if (role === Role.ADMIN || role === Role.CLINICIAN) return true;
  if (role === Role.PATIENT) {
    const profile = await getPatientProfileForUser(userId);
    return profile?.id === patientId;
  }
  return false;
}

export async function getPatientIdForUser(userId: string): Promise<string | null> {
  const profile = await getPatientProfileForUser(userId);
  return profile?.id ?? null;
}
