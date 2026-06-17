/**
 * File upload helpers.
 *
 * Supports two storage backends controlled by STORAGE_PROVIDER env var:
 *  - "supabase" (default): Supabase Storage
 *  - "s3": AWS S3
 *
 * The public URL is always returned so the rest of the app stays storage-agnostic.
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds 25 MB limit" };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Accepted: PDF, images, Word documents, and plain text.`,
    };
  }
  return { valid: true };
}

export function buildStorageKey(
  folder: string,
  patientId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  // Strip everything after the last dot to get extension
  const lastDot = fileName.lastIndexOf(".");
  const ext = lastDot >= 0 ? fileName.slice(lastDot) : "";
  const base = fileName
    .slice(0, lastDot >= 0 ? lastDot : undefined)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
  return `${folder}/${patientId}/${timestamp}_${base}${ext}`;
}

/**
 * Upload a file buffer to the configured storage backend.
 * This runs server-side only (e.g., inside an API route).
 */
export async function uploadFile(params: {
  buffer: Buffer;
  folder: "labs" | "documents" | "consent" | "avatars";
  patientId: string;
  originalName: string;
  mimeType: string;
}): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER ?? "supabase";
  const fileKey = buildStorageKey(
    params.folder,
    params.patientId,
    params.originalName
  );

  if (provider === "s3") {
    return uploadToS3({ ...params, fileKey });
  }
  return uploadToSupabase({ ...params, fileKey });
}

function uploadToSupabase(params: {
  buffer: Buffer;
  folder: string;
  patientId: string;
  originalName: string;
  mimeType: string;
  fileKey: string;
}): Promise<UploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase storage credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return (async () => {
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase.storage
      .from("yoothwellness")
      .upload(params.fileKey, params.buffer, {
        contentType: params.mimeType,
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: publicData } = supabase.storage
      .from("yoothwellness")
      .getPublicUrl(params.fileKey);

    return {
      fileKey: params.fileKey,
      fileUrl: publicData.publicUrl,
      fileName: params.originalName,
      fileSize: params.buffer.length,
      mimeType: params.mimeType,
    };
  })();
}

async function uploadToS3(params: {
  buffer: Buffer;
  folder: string;
  patientId: string;
  originalName: string;
  mimeType: string;
  fileKey: string;
}): Promise<UploadResult> {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 credentials are not fully configured. Check AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
    );
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.fileKey,
      Body: params.buffer,
      ContentType: params.mimeType,
    })
  );

  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${params.fileKey}`;

  return {
    fileKey: params.fileKey,
    fileUrl,
    fileName: params.originalName,
    fileSize: params.buffer.length,
    mimeType: params.mimeType,
  };
}

export async function deleteFile(fileKey: string): Promise<void> {
  const provider = process.env.STORAGE_PROVIDER ?? "supabase";

  if (provider === "s3") {
    const region = process.env.AWS_REGION!;
    const bucket = process.env.AWS_S3_BUCKET!;
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }));
  } else {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.storage.from("yoothwellness").remove([fileKey]);
  }
}
