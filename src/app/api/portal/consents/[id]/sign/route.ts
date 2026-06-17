import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser, canAccessPatient } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const signSchema = z.object({
  signature: z.string().min(2),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePatient();
    const profile = await getPatientProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const consent = await prisma.consentForm.findUnique({ where: { id } });

    if (!consent) {
      return NextResponse.json({ error: "Consent not found" }, { status: 404 });
    }

    const hasAccess = await canAccessPatient(user.id, user.role, consent.patientId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (consent.status === "SIGNED") {
      return NextResponse.json({ error: "Already signed" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await prisma.consentForm.update({
      where: { id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signature: parsed.data.signature,
      },
    });

    await logActivity({
      actorId: user.id,
      patientId: consent.patientId,
      action: "CONSENT_SIGNED",
      entityType: "ConsentForm",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consent sign error:", error);
    return NextResponse.json({ error: "Sign failed" }, { status: 500 });
  }
}
