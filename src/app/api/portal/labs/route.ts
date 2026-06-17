import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth-utils";
import { getPatientProfileForUser } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/uploads";
import { logActivity, createNotification } from "@/lib/activity";

export async function POST(request: Request) {
  try {
    const user = await requirePatient();
    const profile = await getPatientProfileForUser(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const testName = formData.get("testName") as string;
    const testDate = formData.get("testDate") as string | null;
    const file = formData.get("file") as File | null;

    if (!testName || !file) {
      return NextResponse.json({ error: "Test name and file are required" }, { status: 400 });
    }

    const uploaded = await saveUploadedFile(file, "labs");

    const lab = await prisma.labResult.create({
      data: {
        patientId: profile.id,
        testName,
        testDate: testDate ? new Date(testDate) : null,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        status: "PENDING",
      },
    });

    await logActivity({
      actorId: user.id,
      patientId: profile.id,
      action: "LAB_UPLOADED",
      entityType: "LabResult",
      entityId: lab.id,
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "New lab result uploaded",
          body: `${user.name} uploaded a new lab result: ${testName}`,
          type: "LAB",
          link: "/admin/labs",
        })
      )
    );

    return NextResponse.json({ success: true, id: lab.id }, { status: 201 });
  } catch (error) {
    console.error("Lab upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
