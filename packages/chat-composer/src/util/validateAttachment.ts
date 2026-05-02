import type { ComposerAttachment } from "../types";

export type ValidationOptions = {
  maxBytes: number;
  acceptedMimeTypes: readonly string[];
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "too_large" | "type_disallowed"; message: string };

export function validateFile(
  file: File,
  options: ValidationOptions
): ValidationResult {
  if (file.size > options.maxBytes) {
    return {
      ok: false,
      reason: "too_large",
      message: `${file.name} is ${formatMb(file.size)} — over the ${formatMb(
        options.maxBytes
      )} limit per file.`,
    };
  }
  const mime = file.type || "application/octet-stream";
  if (!options.acceptedMimeTypes.includes(mime)) {
    return {
      ok: false,
      reason: "type_disallowed",
      message: `${mime || "Unknown type"} is not an accepted attachment type.`,
    };
  }
  return { ok: true };
}

export function formatMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export function classifyAttachment(file: File): ComposerAttachment["kind"] {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (
    mime.startsWith("application/msword") ||
    mime.includes("officedocument") ||
    mime === "text/plain"
  ) {
    return "doc";
  }
  return "other";
}

let attachmentCounter = 0;
export function nextAttachmentId(): string {
  attachmentCounter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  return `att-${Date.now().toString(36)}-${attachmentCounter}`;
}
