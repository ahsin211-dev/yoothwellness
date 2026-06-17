import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveUploadedFile(
  file: File,
  subfolder: string
): Promise<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || "";
  const uniqueName = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, subfolder);
  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, uniqueName);
  await writeFile(filePath, buffer);

  return {
    fileUrl: `/api/uploads/${subfolder}/${uniqueName}`,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: buffer.length,
  };
}

export function getUploadPath(subfolder: string, filename: string): string {
  return path.join(UPLOAD_DIR, subfolder, filename);
}
