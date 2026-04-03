import "server-only";

import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase";

export type LearnUploadedAsset = {
  secureUrl: string;
  publicId: string;
  mimeType: string | null;
  size: number | null;
  name: string;
};

type UploadConfig = {
  allowedTypes: Set<string>;
  maxBytes: number;
  missingFileMessage: string;
  oversizeMessage: string;
  invalidTypeMessage: string;
};

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 12 * 1024 * 1024;
const DEFAULT_BUCKET = "learn-teaching-files";

function sanitizeSegment(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureBucket(bucket: string, config: UploadConfig) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  if ((buckets ?? []).some((entry) => entry.name === bucket || entry.id === bucket)) {
    return;
  }

  await admin.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: String(config.maxBytes),
    allowedMimeTypes: [...config.allowedTypes],
  });
}

async function uploadAssetInternal(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  },
  config: UploadConfig
): Promise<LearnUploadedAsset> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error(config.missingFileMessage);
  }

  if (file.size > config.maxBytes) {
    throw new Error(config.oversizeMessage);
  }

  if (!config.allowedTypes.has(String(file.type || "").toLowerCase())) {
    throw new Error(config.invalidTypeMessage);
  }

  const bucket =
    String(process.env.LEARN_TEACHING_FILES_BUCKET || DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
  await ensureBucket(bucket, config);

  const folder = sanitizeSegment(options.folderSuffix) || "teacher";
  const publicPrefix = sanitizeSegment(options.publicIdPrefix) || "teach";
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  const objectPath = [folder, `${publicPrefix}-${randomUUID()}${extension ? `.${extension}` : ""}`]
    .filter(Boolean)
    .join("/");

  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminSupabase();
  const uploaded = await admin.storage.from(bucket).upload(objectPath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploaded.error) {
    throw new Error(uploaded.error.message || "Supporting file upload failed. Please try again.");
  }

  const signed = await admin.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 30);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(
      signed.error?.message ||
        "Supporting file upload succeeded but the access URL could not be created."
    );
  }

  return {
    secureUrl: signed.data.signedUrl,
    publicId: objectPath,
    mimeType: file.type || null,
    size: file.size || null,
    name: file.name,
  };
}

export async function uploadTeacherApplicationFile(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  }
) {
  return uploadAssetInternal(file, options, {
    allowedTypes: ALLOWED_TYPES,
    maxBytes: MAX_BYTES,
    missingFileMessage: "No file was provided.",
    oversizeMessage: "Please upload files under 12MB.",
    invalidTypeMessage: "Please upload a PDF, DOC, DOCX, JPG, PNG, or WebP file.",
  });
}
