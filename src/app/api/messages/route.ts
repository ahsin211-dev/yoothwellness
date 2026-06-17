import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const sendMessageSchema = z.object({
  toUserId: z.string().min(1, "Recipient is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
  parentId: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "inbox"; // inbox | sent

  const where =
    type === "sent"
      ? { fromUserId: session.user.id, parentId: null }
      : { toUserId: session.user.id, parentId: null };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { id: true, name: true, email: true, image: true } },
      to: { select: { id: true, name: true, email: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          from: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
    take: 50,
  });

  return NextResponse.json({ success: true, data: messages });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { toUserId, subject, body: messageBody, parentId } = parsed.data;

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, isActive: true },
  });

  if (!recipient || !recipient.isActive) {
    return NextResponse.json(
      { success: false, error: "Recipient not found" },
      { status: 404 }
    );
  }

  // Patients can only message admin/clinician users
  if (session.user.role === "PATIENT") {
    const isAdminUser = await prisma.user.findFirst({
      where: {
        id: toUserId,
        role: { in: ["ADMIN", "CLINICIAN"] },
      },
    });
    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Patients can only message care team members" },
        { status: 403 }
      );
    }
  }

  const message = await prisma.message.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      subject,
      body: messageBody,
      parentId,
    },
    include: {
      from: { select: { id: true, name: true, email: true, image: true } },
      to: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  // Create notification for recipient
  await prisma.notification.create({
    data: {
      userId: toUserId,
      title: "New message",
      body: subject ? `${subject} — from ${message.from.name ?? message.from.email}` : `New message from ${message.from.name ?? message.from.email}`,
      link: session.user.role === "PATIENT" ? "/admin/messages" : "/portal/messages",
    },
  });

  await logActivity({
    userId: session.user.id,
    type: "MESSAGE_SENT",
    description: `Message sent to ${message.to.name ?? message.to.email}`,
    metadata: { messageId: message.id, toUserId },
  });

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
