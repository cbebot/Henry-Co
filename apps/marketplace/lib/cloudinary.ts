import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { shouldAutoFlag } from "@henryco/trust";

function requireCloudinaryEnv() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = (process.env.CLOUDINARY_FOLDER || "henryco/marketplace").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured for this environment.");
  }

  return { cloudName, apiKey, apiSecret, baseFolder };
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
): Promise<{ secureUrl: string; publicId: string; ocrWarning: string | null }> {
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

  // OCR text extraction is gated on CLOUDINARY_OCR_ENABLED=1.
  // When enabled, "ocr=adv_ocr" is included in the Cloudinary signature (sorted
  // alphabetically: folder < ocr < public_id < timestamp) and in the upload form.
  // If the add-on is unavailable the info.ocr field will be absent — that is
  // treated as "no text found" and the upload proceeds normally.
  // Only applies to non-raw resource types where OCR is meaningful.
  const ocrEnabled =
    process.env.CLOUDINARY_OCR_ENABLED === "1" && options.resourceType !== "raw";

  const signatureBase = ocrEnabled
    ? `folder=${folder}&ocr=adv_ocr&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    : `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signatureBase).digest("hex");

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);
  if (ocrEnabled) form.set("ocr", "adv_ocr");

  const resourceType = options.resourceType || "auto";
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });

  const payloadJson = (await response.json().catch(() => null)) as
    | {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
        info?: {
          ocr?: {
            adv_ocr?: {
              status?: string;
              data?: Array<{ fullTextAnnotation?: { text?: string } }>;
            };
          };
        };
      }
    | null;

  if (!response.ok || !payloadJson?.secure_url || !payloadJson.public_id) {
    throw new Error(payloadJson?.error?.message || "Upload failed. Please try again.");
  }

  // If OCR extracted text, run content safety detection on it.
  // Extraction is only treated as complete when status === "complete".
  // Absent or errored OCR info is silently ignored — do not block the upload.
  let ocrWarning: string | null = null;
  if (ocrEnabled) {
    const ocrData = payloadJson.info?.ocr?.adv_ocr;
    if (ocrData?.status === "complete") {
      const extractedText = ocrData.data?.[0]?.fullTextAnnotation?.text ?? "";
      if (extractedText) {
        const ocrFlag = shouldAutoFlag(extractedText);
        if (ocrFlag.flag) {
          if (ocrFlag.severity === "high" || ocrFlag.severity === "critical") {
            throw new Error(
              "The uploaded document image contains content that cannot be accepted. " +
                "Remove any contact details, QR codes, or off-platform instructions before re-uploading."
            );
          }
          // Medium: surface as a warning so the caller can record it for review
          ocrWarning = ocrFlag.reason;
        }
      }
    }
  }

  return {
    secureUrl: payloadJson.secure_url,
    publicId: payloadJson.public_id,
    ocrWarning,
  };
}
