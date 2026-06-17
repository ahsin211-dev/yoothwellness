import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const user = await requirePatient();
    const profile = await getPatientProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name: data.name, phone: data.phone || null },
      }),
      prisma.patientProfile.update({
        where: { id: profile.id },
        data: {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          emergencyContact: data.emergencyContact || null,
          emergencyPhone: data.emergencyPhone || null,
          medicalHistory: data.medicalHistory || null,
          allergies: data.allergies || null,
        },
      }),
    ]);

    await logActivity({
      actorId: user.id,
      patientId: profile.id,
      action: "PROFILE_UPDATED",
      entityType: "PatientProfile",
      entityId: profile.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
