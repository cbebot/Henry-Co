import "server-only";

import { createHash, randomUUID } from "crypto";

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

function requireCloudinaryEnv() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = String(process.env.CLOUDINARY_FOLDER || "henryco/learn").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured for this environment.");
  }

  return { cloudName, apiKey, apiSecret, baseFolder };
}

function sanitizeSegment(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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

  const { cloudName, apiKey, apiSecret, baseFolder } = requireCloudinaryEnv();
  const folder = [baseFolder, sanitizeSegment(options.folderSuffix) || "teacher"]
    .filter(Boolean)
    .join("/");
  const publicPrefix = sanitizeSegment(options.publicIdPrefix) || "teach";
  const publicId = `${publicPrefix}-${randomUUID().slice(0, 12)}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signaturePayload).digest("hex");

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const isImage = String(file.type || "").toLowerCase().startsWith("image/");
  const resourcePath = isImage ? "image/upload" : "raw/upload";

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourcePath}`,
    { method: "POST", body: form }
  );

  const payload = (await response.json().catch(() => null)) as
    | { secure_url?: string; public_id?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.secure_url || !payload?.public_id) {
    throw new Error(
      payload?.error?.message || "Supporting file upload failed. Please try again."
    );
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
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
