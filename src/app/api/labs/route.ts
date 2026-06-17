import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const createLabSchema = z.object({
  patientId: z.string().min(1),
  labName: z.string().min(1, "Lab name is required"),
  testName: z.string().min(1, "Test name is required"),
  collectedAt: z.string().optional(),
  receivedAt: z.string().optional(),
  notes: z.string().optional(),
  biomarkers: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.number().optional(),
        unit: z.string().optional(),
        referenceMin: z.number().optional(),
        referenceMax: z.number().optional(),
        isInRange: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  let patientId = searchParams.get("patientId");

  // If patient is requesting their own labs, find their patient record
  if (session.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient profile not found" }, { status: 404 });
    }
    patientId = patient.id;
  } else if (!patientId) {
    return NextResponse.json({ success: false, error: "patientId is required" }, { status: 400 });
  }

  const labs = await prisma.labResult.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      files: true,
      biomarkers: true,
    },
  });

  return NextResponse.json({ success: true, data: labs });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CLINICIAN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createLabSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { patientId, labName, testName, collectedAt, receivedAt, notes, biomarkers } = parsed.data;

  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true } } },
  });

  if (!patient) {
    return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
  }

  const labResult = await prisma.labResult.create({
    data: {
      patientId,
      uploadedById: session.user.id,
      labName,
      testName,
      collectedAt: collectedAt ? new Date(collectedAt) : undefined,
      receivedAt: receivedAt ? new Date(receivedAt) : undefined,
      notes,
      status: "RECEIVED",
      biomarkers: biomarkers
        ? { create: biomarkers }
        : undefined,
    },
    include: { files: true, biomarkers: true },
  });

  // Log activity for the patient
  await logActivity({
    userId: patient.user.id,
    adminId: session.user.id,
    type: "LAB_UPLOAD",
    description: `Lab result "${testName}" uploaded by care team`,
    metadata: { labResultId: labResult.id },
  });

  return NextResponse.json({ success: true, data: labResult }, { status: 201 });
}
