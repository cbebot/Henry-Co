import "server-only";

import { createHash, randomUUID } from "crypto";

function requireCloudinaryEnv() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = (process.env.CLOUDINARY_FOLDER || "henryco/account").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured for this environment.");
  }
  return { cloudName, apiKey, apiSecret, baseFolder };
}

export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<{ secureUrl: string; publicId: string }> {
  return uploadOwnedAsset(file, userId, {
    folder: "avatars",
    resourceType: "image",
    maxBytes: 5 * 1024 * 1024,
    allowedTypes: new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
    invalidTypeMessage: "Please upload a JPG, PNG, or WebP image.",
  });
}

type UploadOwnedAssetOptions = {
  folder: string;
  resourceType?: "image" | "raw" | "auto";
  maxBytes?: number;
  allowedTypes?: Set<string>;
  invalidTypeMessage?: string;
  publicIdPrefix?: string;
};

export async function uploadOwnedAsset(
  file: File,
  userId: string,
  options: UploadOwnedAssetOptions
): Promise<{ secureUrl: string; publicId: string }> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("No file provided.");
  }

  if (options.maxBytes && file.size > options.maxBytes) {
    throw new Error(`Please upload a file under ${Math.round(options.maxBytes / 1024 / 1024)} MB.`);
  }

  if (options.allowedTypes && !options.allowedTypes.has(file.type.toLowerCase())) {
    throw new Error(options.invalidTypeMessage || "Unsupported file type.");
  }

  const { cloudName, apiKey, apiSecret, baseFolder } = requireCloudinaryEnv();
  const folder = `${baseFolder}/${options.folder}`;
  const publicId = `${
    options.publicIdPrefix || options.folder.replace(/[^a-z0-9]+/gi, "-")
  }-${userId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const payload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(payload).digest("hex");

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const resourceType = options.resourceType || "auto";
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );

  const data = (await res.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;

  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Upload failed. Please try again.");
  }

  return { secureUrl: data.secure_url, publicId: data.public_id! };
}
