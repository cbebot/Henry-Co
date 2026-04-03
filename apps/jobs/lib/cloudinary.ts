import "server-only";

import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase";

export type JobsUploadedAsset = {
  secureUrl: string;
  publicId: string;
};

type UploadConfig = {
  allowedTypes: Set<string>;
  maxBytes: number;
  missingFileMessage: string;
  oversizeMessage: string;
  invalidTypeMessage: string;
};

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;
const DEFAULT_BUCKET = "jobs-documents";

function sanitizeFileSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureJobsBucket(bucket: string, config: UploadConfig) {
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

async function uploadJobsAssetInternal(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  },
  config: UploadConfig
): Promise<JobsUploadedAsset> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error(config.missingFileMessage);
  }

  if (file.size > config.maxBytes) {
    throw new Error(config.oversizeMessage);
  }

  if (!config.allowedTypes.has(String(file.type || "").toLowerCase())) {
    throw new Error(config.invalidTypeMessage);
  }

  const bucket = String(process.env.JOBS_DOCUMENTS_BUCKET || DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
  await ensureJobsBucket(bucket, config);

  const folder = sanitizeFileSlug(options.folderSuffix) || "candidate";
  const publicPrefix = sanitizeFileSlug(options.publicIdPrefix) || "jobs";
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
    throw new Error(uploaded.error.message || "Document upload failed. Please try again.");
  }

  const signed = await admin.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 30);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(signed.error?.message || "Document upload succeeded but the access URL could not be created.");
  }

  return {
    secureUrl: signed.data.signedUrl,
    publicId: objectPath,
  };
}

export async function uploadJobsDocument(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  }
) {
  return uploadJobsAssetInternal(file, options, {
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    maxBytes: MAX_DOCUMENT_BYTES,
    missingFileMessage: "No file was provided.",
    oversizeMessage: "Please upload a file under 12MB.",
    invalidTypeMessage: "Please upload a PDF, DOC, DOCX, JPG, PNG, or WebP file.",
  });
}
