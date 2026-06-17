import { auth } from "@/auth";
import { Role } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(Role.ADMIN);
}

export async function requireStaff(): Promise<SessionUser> {
  return requireRole(Role.ADMIN, Role.CLINICIAN);
}

export async function requirePatient(): Promise<SessionUser> {
  return requireRole(Role.PATIENT);
}

export function isStaff(role: Role): boolean {
  return role === Role.ADMIN || role === Role.CLINICIAN;
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}
