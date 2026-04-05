export const HQ_IC_STORAGE_BUCKET = "hq-internal-comms";

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const VOICE = new Set([
  "audio/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
]);
const FILE = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/zip",
]);

const MAX: Record<"image" | "video" | "file" | "voice", number> = {
  image: 25 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  file: 50 * 1024 * 1024,
  voice: 25 * 1024 * 1024,
};

export type UploadKind = "image" | "video" | "file" | "voice";

export function normalizeUploadKind(kind: string): UploadKind | null {
  const k = String(kind || "").toLowerCase();
  if (k === "image" || k === "photo") return "image";
  if (k === "video") return "video";
  if (k === "voice" || k === "audio") return "voice";
  if (k === "file" || k === "document") return "file";
  return null;
}

export function validateUploadDescriptor(input: {
  kind: UploadKind;
  mimeType: string;
  byteSize: number;
}) {
  const mime = String(input.mimeType || "").toLowerCase().split(";")[0].trim();
  const allowed =
    input.kind === "image"
      ? IMAGE
      : input.kind === "video"
        ? VIDEO
        : input.kind === "voice"
          ? VOICE
          : FILE;

  if (!allowed.has(mime)) {
    return { ok: false as const, message: "This file type is not allowed for internal uploads." };
  }

  const max = MAX[input.kind];
  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0 || input.byteSize > max) {
    return {
      ok: false as const,
      message: `File is too large for ${input.kind} uploads (max ${Math.round(max / (1024 * 1024))}MB).`,
    };
  }

  return { ok: true as const, mime };
}

export function sanitizeStorageFileName(name: string) {
  const base = String(name || "file").split(/[/\\]/).pop() || "file";
  const cleaned = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  return cleaned.length ? cleaned : "file";
}
