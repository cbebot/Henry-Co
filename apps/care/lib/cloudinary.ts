import "server-only";

import { createHash, randomUUID } from "crypto";

export type CareUploadedAsset = {
  secureUrl: string;
  publicId: string;
};

type UploadConfig = {
  allowedTypes: Set<string>;
  maxBytes: number;
  missingFileMessage: string;
  oversizeMessage: string;
  invalidTypeMessage: string;
  resourcePath?: string;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
]);
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

function requireCloudinaryEnv() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = String(process.env.CLOUDINARY_FOLDER || "henryco/care").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured for this environment.");
  }

  return { cloudName, apiKey, apiSecret, baseFolder };
}

function sanitizeFileSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildUploadSignature(input: {
  folder: string;
  publicId: string;
  timestamp: number;
  apiSecret: string;
}) {
  const payload = `folder=${input.folder}&public_id=${input.publicId}&timestamp=${input.timestamp}${input.apiSecret}`;
  return createHash("sha1").update(payload).digest("hex");
}

async function uploadCareAssetInternal(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  },
  config: UploadConfig
): Promise<CareUploadedAsset> {
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
  const folder = [baseFolder, options.folderSuffix].filter(Boolean).join("/");
  const fileSlug = sanitizeFileSlug(file.name.replace(/\.[^/.]+$/, "")) || "upload";
  const publicId = `${sanitizeFileSlug(options.publicIdPrefix) || "care"}-${fileSlug}-${randomUUID().slice(0, 8)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildUploadSignature({
    folder,
    publicId,
    timestamp,
    apiSecret,
  });

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${config.resourcePath || "auto/upload"}`,
    {
      method: "POST",
      body: form,
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      }
    | null;

  if (!response.ok || !payload?.secure_url || !payload?.public_id) {
    throw new Error(
      payload?.error?.message || "Image upload failed. Please try again with a smaller file."
    );
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

export async function uploadCareImage(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  }
): Promise<CareUploadedAsset> {
  return uploadCareAssetInternal(file, options, {
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    missingFileMessage: "No image file was provided.",
    oversizeMessage: "Please upload an image under 8MB.",
    invalidTypeMessage: "Please upload a JPG, PNG, or WebP image.",
  });
}

export async function uploadCareReceiptAsset(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  }
): Promise<CareUploadedAsset> {
  return uploadCareAssetInternal(file, options, {
    allowedTypes: ALLOWED_RECEIPT_TYPES,
    maxBytes: MAX_RECEIPT_BYTES,
    missingFileMessage: "No receipt file was provided.",
    oversizeMessage: "Please upload a receipt under 10MB.",
    invalidTypeMessage: "Please upload a JPG, PNG, WebP image, or PDF receipt.",
  });
}

export async function uploadCareVideo(
  file: File,
  options: {
    folderSuffix: string;
    publicIdPrefix: string;
  }
): Promise<CareUploadedAsset> {
  return uploadCareAssetInternal(file, options, {
    allowedTypes: ALLOWED_VIDEO_TYPES,
    maxBytes: MAX_VIDEO_BYTES,
    missingFileMessage: "No video file was provided.",
    oversizeMessage: "Please upload a video under 40MB.",
    invalidTypeMessage: "Please upload an MP4, WebM, or MOV video.",
    resourcePath: "video/upload",
  });
}
