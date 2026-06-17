import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, validateFile } from "@/lib/upload";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CLINICIAN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const patientId = formData.get("patientId") as string | null;
  const folder = (formData.get("folder") as string) ?? "documents";
  const labResultId = formData.get("labResultId") as string | null;
  const category = formData.get("category") as string | null;
  const description = formData.get("description") as string | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  if (!patientId) {
    return NextResponse.json({ success: false, error: "patientId is required" }, { status: 400 });
  }

  // Validate file
  const validation = validateFile({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true } } },
  });

  if (!patient) {
    return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to storage
  let uploadResult;
  try {
    uploadResult = await uploadFile({
      buffer,
      folder: folder as "labs" | "documents" | "consent" | "avatars",
      patientId,
      originalName: file.name,
      mimeType: file.type,
    });
  } catch (err) {
    console.error("[Upload] Storage error:", err);
    return NextResponse.json(
      { success: false, error: "File upload failed. Please try again." },
      { status: 500 }
    );
  }

  // Save to database
  if (labResultId) {
    // Attach to a lab result
    const labFile = await prisma.labFile.create({
      data: {
        labResultId,
        fileName: uploadResult.fileName,
        fileKey: uploadResult.fileKey,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
      },
    });

    await logActivity({
      userId: patient.user.id,
      adminId: session.user.id,
      type: "FILE_UPLOADED",
      description: `Lab file "${file.name}" uploaded`,
      metadata: { labResultId, labFileId: labFile.id },
    });

    return NextResponse.json({ success: true, data: labFile }, { status: 201 });
  } else {
    // Attach as patient document
    const doc = await prisma.patientDocument.create({
      data: {
        patientId,
        uploadedById: session.user.id,
        fileName: uploadResult.fileName,
        fileKey: uploadResult.fileKey,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        category: category ?? undefined,
        description: description ?? undefined,
      },
    });

    await logActivity({
      userId: patient.user.id,
      adminId: session.user.id,
      type: "FILE_UPLOADED",
      description: `Document "${file.name}" uploaded`,
      metadata: { documentId: doc.id },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  }
}
