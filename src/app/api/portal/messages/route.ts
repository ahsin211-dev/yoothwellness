import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { logActivity, createNotification } from "@/lib/activity";

const messageSchema = z.object({
  toId: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requirePatient();
    const profile = await getPatientProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: parsed.data.toId },
    });

    if (!recipient || (recipient.role !== "ADMIN" && recipient.role !== "CLINICIAN")) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        patientId: profile.id,
        fromId: user.id,
        toId: parsed.data.toId,
        subject: parsed.data.subject,
        body: parsed.data.body,
      },
    });

    await createNotification({
      userId: parsed.data.toId,
      title: `Message from ${user.name}`,
      body: parsed.data.subject,
      type: "MESSAGE",
      link: "/admin/messages",
    });

    await logActivity({
      actorId: user.id,
      patientId: profile.id,
      action: "MESSAGE_SENT",
      entityType: "Message",
      entityId: message.id,
    });

    return NextResponse.json({ success: true, id: message.id }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
