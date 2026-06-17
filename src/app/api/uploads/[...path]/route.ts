import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { getUploadPath } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: pathSegments } = await params;
  if (!pathSegments || pathSegments.length < 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const [subfolder, ...rest] = pathSegments;
  const filename = rest.join("/");

  if (filename.includes("..") || subfolder.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const allowedFolders = ["labs", "documents", "consents"];
  if (!allowedFolders.includes(subfolder)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const filePath = getUploadPath(subfolder, filename);
    const fileBuffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
